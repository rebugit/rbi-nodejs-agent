import {LambdaIntegration} from "../../src/integrations/lambdaIntegration";
import {Tracer} from "../../src/trace/Tracer";
import {ITraceServiceApi} from "../../src/trace/Api";
import {TracesLoader} from "../../src/trace/TracesLoader";
import {ITrace} from "../../src/trace/Trace";
import {Context} from "aws-lambda";
import {CorrelationIds, Environments} from "../../src/sharedKernel/constants";
import {OperationsType} from "../../src/integrations/constants";
import {parse, stringify} from "flatted";
import Mock = jest.Mock;
import Spy = jest.SpyInstance;
import {clearEnvironmentVariables} from "../utils";


class MockApi implements ITraceServiceApi {
    createError(tracer, error): Promise<void> {
        return Promise.resolve(undefined);
    }

    findByTraceId(traceId: string): Promise<ITrace[]> {
        return Promise.resolve([]);
    }
}

describe("LambdaIntegration", function () {
    const event = {
        body: "{}",
        path: "/",
    };
    const context: Context = {
        awsRequestId: "",
        callbackWaitsForEmptyEventLoop: false,
        functionName: "",
        functionVersion: "",
        invokedFunctionArn: "",
        logGroupName: "",
        logStreamName: "",
        memoryLimitInMB: "",
        done(error?: Error, result?: any): void {
        },
        fail(error: Error | string): void {
        },
        getRemainingTimeInMillis(): number {
            return 0;
        },
        succeed(message: any, object?: any): void {
        },
    };

    afterEach(function () {
        clearEnvironmentVariables()
    });

    describe("Callback based function", function () {
        describe("Production mode", function () {
            let lambdaIntegration: LambdaIntegration,
                tracer: Tracer,
                tracesLoader: TracesLoader,
                mockApi: ITraceServiceApi,
                mockCallback: Mock,
                mockCloseIntegration: Mock,
                spyCreateError: Spy,
                wrappedCallback: (error: Error, response: any) => void;

            beforeEach(function () {
                tracer = new Tracer();
                mockApi = new MockApi();
                tracesLoader = new TracesLoader();
                lambdaIntegration = new LambdaIntegration(
                    tracer,
                    tracesLoader,
                    mockApi
                );
                mockCallback = jest.fn();
                mockCloseIntegration = jest.fn();
                spyCreateError = jest.spyOn(MockApi.prototype, "createError")
                wrappedCallback = lambdaIntegration.wrapCallback(
                    mockCallback,
                    mockCloseIntegration
                );
            });

            afterEach(function () {
                mockCallback.mockRestore();
                mockCloseIntegration.mockRestore();
                spyCreateError.mockRestore()
            });

            it("should add data request event and context to the trace", function () {
                lambdaIntegration.captureRequest({event, context});

                expect(tracer.traces).toHaveLength(1);
                expect(tracer.traces[0].correlationId).toBe(
                    CorrelationIds.LAMBDA_REQUEST
                );
                expect(tracer.traces[0].operationType).toBe(OperationsType.LAMBDA);
                expect(parse(tracer.traces[0].data)).toMatchInlineSnapshot(`
          Object {
            "context": Object {
              "awsRequestId": "",
              "callbackWaitsForEmptyEventLoop": false,
              "functionName": "",
              "functionVersion": "",
              "invokedFunctionArn": "",
              "logGroupName": "",
              "logStreamName": "",
              "memoryLimitInMB": "",
            },
            "event": Object {
              "body": "{}",
              "path": "/",
            },
          }
        `);
            });

            it("should capture error from status code", function () {
                const response = {statusCode: 500, body: "Something went wrong"};

                lambdaIntegration.captureRequest({event, context});
                wrappedCallback(null, response);

                expect(spyCreateError).toHaveBeenCalledTimes(1);
                expect(spyCreateError.mock.calls[0][0]._traces).toHaveLength(1);
                expect(spyCreateError.mock.calls[0][0]._traceId).toBeDefined();
                expect(spyCreateError.mock.calls[0][1].stack).toBeUndefined();
                expect(spyCreateError.mock.calls[0][1].message).toBe(response.body);
                expect(spyCreateError.mock.calls[0][1].traceId).toBeDefined();

                expect(mockCloseIntegration).toHaveBeenCalledTimes(1);
                expect(mockCallback).toHaveBeenCalledTimes(1);
                expect(mockCallback).toHaveBeenCalledWith(null, response);
            });

            it("should capture error from callback", function () {
                const response = {statusCode: 500, body: "Something went wrong"};
                const err = new Error("test error");

                lambdaIntegration.captureRequest({event, context});
                wrappedCallback(err, response);

                expect(spyCreateError).toHaveBeenCalledTimes(1);
                expect(spyCreateError.mock.calls[0][0]._traces).toHaveLength(1);
                expect(spyCreateError.mock.calls[0][0]._traceId).toBeDefined();
                expect(spyCreateError.mock.calls[0][1].stack).toBeDefined();
                expect(spyCreateError.mock.calls[0][1].message).toBe("test error");
                expect(spyCreateError.mock.calls[0][1].traceId).toBeDefined();

                expect(mockCloseIntegration).toHaveBeenCalledTimes(1);
                expect(mockCallback).toHaveBeenCalledTimes(1);
                expect(mockCallback).toHaveBeenCalledWith(err, response);
            });

            it("should not capture error", function () {
                const response = {statusCode: 200, body: "Hei, Hi Mark"};

                lambdaIntegration.captureRequest({event, context});
                wrappedCallback(null, response);

                expect(spyCreateError).not.toHaveBeenCalled()
                expect(mockCloseIntegration).toHaveBeenCalledTimes(1);
                expect(mockCallback).toHaveBeenCalledTimes(1);
                expect(mockCallback).toHaveBeenCalledWith(null, response);
            })

            it("should not capture internal error", function () {
                const response = {statusCode: 500, body: "Something went wrong"};
                spyCreateError = jest.spyOn(MockApi.prototype, 'createError').mockImplementationOnce(() => {
                    throw new Error('Internal error')
                })

                lambdaIntegration.captureRequest({event, context});
                wrappedCallback(null, response);

                expect(spyCreateError).toHaveBeenCalledTimes(1);
                expect(mockCallback).toHaveBeenCalledWith(null, response);
            })
        });

        describe('Debug mode', function () {
            let lambdaIntegration: LambdaIntegration,
                tracer: Tracer,
                tracesLoader: TracesLoader,
                mockApi: ITraceServiceApi,
                mockCallback: Mock,
                mockCloseIntegration: Mock,
                spyCreateError: Spy,
                wrappedCallback: (error: Error, response: any) => void;

            beforeEach(function () {
                process.env.REBUGIT_ENV = Environments.DEBUG

                tracer = new Tracer();
                mockApi = new MockApi();
                tracesLoader = new TracesLoader();
                lambdaIntegration = new LambdaIntegration(
                    tracer,
                    tracesLoader,
                    mockApi
                );
                mockCallback = jest.fn();
                mockCloseIntegration = jest.fn();
                spyCreateError = jest.spyOn(MockApi.prototype, "createError")
                wrappedCallback = lambdaIntegration.wrapCallback(
                    mockCallback,
                    mockCloseIntegration
                );
            });

            afterEach(function () {
                mockCallback.mockRestore();
                mockCloseIntegration.mockRestore();
                spyCreateError.mockRestore()
            });

            it('should call the callback and skip error capture', function () {
                const response = {statusCode: 500, body: "Something went wrong"};
                const err = new Error("test error");

                wrappedCallback(err, response);

                expect(spyCreateError).not.toHaveBeenCalled();

                expect(mockCloseIntegration).toHaveBeenCalledTimes(1);
                expect(mockCallback).toHaveBeenCalledTimes(1);
                expect(mockCallback).toHaveBeenCalledWith(err, response);
            });

            it('should call the callback and skip error capture with statusCode', function () {
                const response = {statusCode: 500, body: "Something went wrong"};
                wrappedCallback(null, response);

                expect(spyCreateError).not.toHaveBeenCalled();

                expect(mockCloseIntegration).toHaveBeenCalledTimes(1);
                expect(mockCallback).toHaveBeenCalledTimes(1);
                expect(mockCallback).toHaveBeenCalledWith(null, response);
            })

            it('should extract body', async function () {
                tracesLoader.load([{
                    data: stringify({context: {}, event: {body: 'Hey, Hi Mark!'}}),
                    operationType: OperationsType.LAMBDA,
                    correlationId: CorrelationIds.LAMBDA_REQUEST
                }])

                const data = await lambdaIntegration.extractRequest();

                expect(data.event.body).toBe('Hey, Hi Mark!')
                expect(data.context).toBeDefined()
            });
        });
    });

    describe("Async functions", function () {
        const response = {statusCode: 500, body: 'Something went wrong'}

        let lambdaIntegration: LambdaIntegration,
            tracer: Tracer,
            tracesLoader: TracesLoader,
            mockApi: ITraceServiceApi,
            mockCloseIntegration: Mock,
            spyCreateError: Spy,
            mockAsyncHandler: Mock

        beforeEach(function () {
            if (
                expect.getState().currentTestName === 'LambdaIntegration Async functions should not capture error from statusCode' ||
                expect.getState().currentTestName === 'LambdaIntegration Async functions should not capture error from throwable'
            ){
                process.env.REBUGIT_ENV = Environments.DEBUG
            }

            tracer = new Tracer();
            mockApi = new MockApi();
            tracesLoader = new TracesLoader();
            lambdaIntegration = new LambdaIntegration(
                tracer,
                tracesLoader,
                mockApi
            );
            mockCloseIntegration = jest.fn();
            spyCreateError = jest.spyOn(MockApi.prototype, "createError")
            mockAsyncHandler = jest.fn(() => Promise.resolve(response))
        });

        afterEach(function () {
            mockCloseIntegration.mockRestore();
            spyCreateError.mockRestore()
            mockAsyncHandler.mockRestore()
        });

        it('should capture error from statusCode', async function () {
            lambdaIntegration.captureRequest({event, context})
            const response = await lambdaIntegration.asyncHandler(
                mockAsyncHandler,
                {context, event},
                mockCloseIntegration
            );

            expect(response).toEqual(response)
            expect(spyCreateError).toHaveBeenCalledTimes(1);
            expect(spyCreateError.mock.calls[0][0]._traces).toHaveLength(1);
            expect(spyCreateError.mock.calls[0][0]._traceId).toBeDefined();
            expect(spyCreateError.mock.calls[0][1].stack).toBeUndefined();
            expect(spyCreateError.mock.calls[0][1].message).toBe(response.body);
            expect(spyCreateError.mock.calls[0][1].traceId).toBeDefined();
            expect(mockCloseIntegration).toHaveBeenCalledTimes(1)
        });

        it('should capture error from throwable', async function () {
            const err = new Error('test error')
            mockAsyncHandler = jest.fn().mockImplementationOnce(() => Promise.reject(err))

            lambdaIntegration.captureRequest({event, context})
            const response = await lambdaIntegration.asyncHandler(
                mockAsyncHandler,
                {context, event},
                mockCloseIntegration
            );

            expect(response).toEqual(response)
            expect(spyCreateError).toHaveBeenCalledTimes(1);
            expect(spyCreateError.mock.calls[0][0]._traces).toHaveLength(1);
            expect(spyCreateError.mock.calls[0][0]._traceId).toBeDefined();
            expect(spyCreateError.mock.calls[0][1].stack).toBeDefined();
            expect(spyCreateError.mock.calls[0][1].message).toBe('test error');
            expect(spyCreateError.mock.calls[0][1].traceId).toBeDefined();
            expect(mockCloseIntegration).toHaveBeenCalledTimes(1)
        });

        it('should not capture error from statusCode', async function () {
            lambdaIntegration.captureRequest({event, context})
            const response = await lambdaIntegration.asyncHandler(
                mockAsyncHandler,
                {context, event},
                mockCloseIntegration
            );

            expect(response).toEqual(response)
            expect(spyCreateError).not.toHaveBeenCalled();
            expect(mockCloseIntegration).toHaveBeenCalledTimes(1)
        });

        it('should not capture error from throwable', async function () {
            process.env.REBUGIT_ENV = Environments.DEBUG
            const err = new Error('test error')
            mockAsyncHandler = jest.fn().mockImplementationOnce(() => Promise.reject(err))

            lambdaIntegration.captureRequest({event, context})
            const response = await lambdaIntegration.asyncHandler(
                mockAsyncHandler,
                {context, event},
                mockCloseIntegration
            );

            expect(response).toEqual(response)
            expect(spyCreateError).not.toHaveBeenCalled();
            expect(mockCloseIntegration).toHaveBeenCalledTimes(1)
        })
    });
});
