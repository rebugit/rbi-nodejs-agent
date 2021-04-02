import {Trace} from "../trace/Trace";
import {CorrelationIds, Environments, InternalExceptions} from "../sharedKernel/constants";
import {OperationsType} from "./constants";
import {Tracer} from "../trace/Tracer";
import {TracesLoader} from "../trace/TracesLoader";
import {Callback, Context} from "aws-lambda";
import {ErrorDomain} from "../trace/ErrorDomain";
import {ITraceServiceApi, TraceServiceApi} from "../trace/Api";
import {Integrations} from "./integrations";

const logger = require('../logger')

interface ILambdaData {
    event: any,
    context: Context
}

export class LambdaIntegration extends Integrations {
    private readonly tracer: Tracer;
    private tracesLoader: TracesLoader;
    private api: ITraceServiceApi;
    private readonly namespace: string;

    constructor(tracer: Tracer, tracesLoader: TracesLoader, api: ITraceServiceApi) {
        super()
        this.tracer = tracer;
        this.tracesLoader = tracesLoader
        this.api = api
        this.namespace = 'lambdaIntegration'
    }

    doesContainCallback(func: (...args: any[]) => any) {
        return func.length > 2
    }

    captureRequest(obj: ILambdaData) {
        const trace = new Trace({
            data: {
                event: obj.event,
                context: obj.context
            },
            correlationId: CorrelationIds.LAMBDA_REQUEST,
            operationType: OperationsType.LAMBDA,
        })

        this.tracer.add(trace.trace())
    }

    async extractRequest(): Promise<ILambdaData> {
        const traces = await this.api.findByTraceId(process.env.REBUGIT_TRACE_ID);
        this.tracesLoader.load(traces)
        return this.tracesLoader.get<ILambdaData>(CorrelationIds.LAMBDA_REQUEST);
    }

    wrapCallback(originalCallback: Callback, closeIntegrationCallback: () => void) {
        return (err: Error, response: any) => {
            try {
                logger.info("callback", this.namespace)
                closeIntegrationCallback()
                logger.info(`ending trace with traceId: ${this.tracer.traceId}`, this.namespace)

                if (this.env !== Environments.DEBUG) {
                    let error
                    if (err) {
                        error = new ErrorDomain(this.tracer.traceId, err)
                    } else if (response && response.statusCode === 500) {
                        error = new ErrorDomain(this.tracer.traceId, {message: response.body})
                    }

                    if (error) {
                        this.api.createError(this.tracer, error).then()
                    }
                }
            } catch (e) {
                logger.error(e, InternalExceptions.LambdaIntegrationError)
            } finally {
                originalCallback(err, response)
            }
        }
    }

    async asyncHandler(func: (event: any, context: Context) => Promise<any>, obj: ILambdaData, closeIntegrationCallback: () => void) {
        let response: any
        try {
            response = await func(obj.event, obj.context)
            logger.info(`ending trace with traceId: ${this.tracer.traceId}`, this.namespace)
            closeIntegrationCallback()

            if (response && response.statusCode === 500) {
                await this.captureException({
                    message: response.body
                })
            }
        } catch (e) {
            closeIntegrationCallback()
            logger.error(e, InternalExceptions.LambdaIntegrationError)
            await this.captureException(e)
        }

        return response
    }

    async captureException(e: Error | { message: string, stackTrace?: string }): Promise<void> {
        if (this.env === Environments.DEBUG) {
            return
        }

        const error = new ErrorDomain(this.tracer.traceId, e)
        return this.api.createError(this.tracer, error)
    }
}
