import {Tracer} from "../../../src/trace/Tracer";
import {TracesLoader} from "../../../src/trace/TracesLoader";
import {HttpIntegrationV2} from "../../../src/integrations/httpIntegrationV2";
import shimmer = require("shimmer");
import {HttpMock} from "../../../src/integrations/mocks/http";
import * as events from "events";
import {OperationsType} from "../../../src/integrations/constants";

const REQUEST_BASE_URL = 'jsonplaceholder.typicode.com'
const PATH = 'todos/1'
const RESPONSE_BODY = {
    "completed": false,
    "id": 1,
    "title": "test todo",
    "userId": 1,
}

describe('httpIntegration', function () {
    describe('production mode', function () {
        let tracer: Tracer,
            tracesLoader: TracesLoader,
            httpIntegration: HttpIntegrationV2

        beforeEach(async function () {
            httpIntegration = new HttpIntegrationV2()
            tracer = new Tracer()
            tracesLoader = new TracesLoader()
            await httpIntegration.init(tracer, tracesLoader, {})
        });

        afterEach(function () {
            httpIntegration.end()
        });

        it('should capture response body with callback', function (done) {
            const options = {
                host: REQUEST_BASE_URL,
                path: `/${PATH}`,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            const mockHttp = {
                request: (options, cb) => {
                    const httpMock = new HttpMock()
                    const emitter = new events.EventEmitter()
                    const wrappedCallback = () => {
                        cb(emitter)
                    }
                    return httpMock.request(null, wrappedCallback)
                }
            }

            shimmer.wrap(mockHttp, 'request', httpIntegration['wrap']())

            const req = mockHttp.request(options, (res) => {
                let output = '';

                res.on('data', (chunk) => {
                    output += chunk;
                });

                res.on('end', () => {
                    let obj = JSON.parse(output);
                    expect(obj).toEqual(RESPONSE_BODY)
                    expect(tracer.traces.length).toBe(1)
                    expect(tracer.traces[0].correlationId).toBe('GET_jsonplaceholder.typicode.com/todos/1_1')
                    expect(tracer.traces[0].data).toBeDefined()
                    expect(tracer.traces[0].operationType).toBe(OperationsType.RESPONSE)
                    done()
                });

                res.emit('data', Buffer.from(JSON.stringify(RESPONSE_BODY)))
                res.emit('end')
            })
            req.end()

        });

        it('should capture response body with callback for aws services', function (done) {
            const options = {
                host: 'dynamodb.ap-southeast-1.amazonaws.com',
                path: '',
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Amz-Target': 'DynamoDB_20120810.GetItem'
                }
            };

            const mockHttp = {
                request: (options, cb) => {
                    const httpMock = new HttpMock()
                    const emitter = new events.EventEmitter()
                    const wrappedCallback = () => {
                        cb(emitter)
                    }
                    return httpMock.request(null, wrappedCallback)
                }
            }

            shimmer.wrap(mockHttp, 'request', httpIntegration['wrap']())

            const req = mockHttp.request(options, (res) => {
                res.on('end', () => {
                    expect(tracer.traces.length).toBe(1)
                    expect(tracer.traces[0].correlationId).toBe('GET_dynamodb.ap-southeast-1.amazonaws.com/_DynamoDB_20120810.GetItem_1')
                    expect(tracer.traces[0].data).toBeDefined()
                    expect(tracer.traces[0].operationType).toBe('DYNAMODB')
                    done()
                });

                res.emit('end')
            })
            req.end()
        });
    });
});