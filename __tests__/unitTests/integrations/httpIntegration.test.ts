import {Tracer} from "../../../src/trace/Tracer";
import {TracesLoader} from "../../../src/trace/TracesLoader";
import {HttpIntegration} from "../../../src/integrations/httpIntegration";
import {Environments} from "../../../src/sharedKernel/constants";
import shimmer = require("shimmer");
import * as https from "https";
import {HttpMock} from "../../../src/integrations/mocks/http";
import * as events from "events";
import {OperationsType} from "../../../src/integrations/constants";

const fakeTrace = {
    "id": "e406231c-e637-4e74-9ef6-d8f3950e49cd",
    "tenantId": "69a34c58-45dc-43df-a876-643395d892e0",
    "traceId": "2c4f19a4-261e-44ae-9004-995f4a4764fa",
    "correlationId": "GET_jsonplaceholder.typicode.com/todos/1_1",
    "data": "[{\"body\":\"1\",\"headers\":\"2\",\"statusCode\":200,\"statusMessage\":\"3\"},\"{\\n  \\\"userId\\\": 1,\\n  \\\"id\\\": 1,\\n  \\\"title\\\": \\\"test todo\\\",\\n  \\\"completed\\\": false\\n}\",{\"date\":\"4\",\"content-type\":\"5\",\"content-length\":\"6\",\"connection\":\"7\",\"set-cookie\":\"8\",\"x-powered-by\":\"9\",\"x-ratelimit-limit\":\"10\",\"x-ratelimit-remaining\":\"11\",\"x-ratelimit-reset\":\"12\",\"vary\":\"13\",\"access-control-allow-credentials\":\"14\",\"cache-control\":\"15\",\"pragma\":\"16\",\"expires\":\"17\",\"x-content-type-options\":\"18\",\"etag\":\"19\",\"via\":\"20\",\"cf-cache-status\":\"21\",\"age\":\"22\",\"accept-ranges\":\"23\",\"cf-request-id\":\"24\",\"report-to\":\"25\",\"nel\":\"26\",\"server\":\"27\",\"cf-ray\":\"28\",\"alt-svc\":\"29\"},\"OK\",\"Tue, 02 Mar 2021 14:21:37 GMT\",\"application/json; charset=utf-8\",\"83\",\"close\",[\"30\"],\"Express\",\"1000\",\"999\",\"1604524310\",\"Origin, Accept-Encoding\",\"true\",\"max-age=43200\",\"no-cache\",\"-1\",\"nosniff\",\"W/\\\"53-hfEnumeNh6YirfjyjaujcOPPT+s\\\"\",\"1.1 vegur\",\"HIT\",\"23091\",\"bytes\",\"0894e9eedd0000ef61951e4000000001\",\"{\\\"endpoints\\\":[{\\\"url\\\":\\\"https:\\\\/\\\\/a.nel.cloudflare.com\\\\/report?s=xPql%2Fb%2B26R5%2BNVLUsiUFEuZj7qUHIGAjXdlWJqo6JZ1mAOcbIPEK%2BT0OP%2BnT1eeznuAv%2Bhvp1HtOudoTHkqOODN7wyP%2FhibCxUcP5F8uApzrqE7zuywYNf4orjsS\\\"}],\\\"group\\\":\\\"cf-nel\\\",\\\"max_age\\\":604800}\",\"{\\\"report_to\\\":\\\"cf-nel\\\",\\\"max_age\\\":604800}\",\"cloudflare\",\"629b45c499e9ef61-NRT\",\"h3-27=\\\":443\\\"; ma=86400, h3-28=\\\":443\\\"; ma=86400, h3-29=\\\":443\\\"; ma=86400\",\"__cfduid=daee93fd26c0d600736e76dfa91f191d61614694897; expires=Thu, 01-Apr-21 14:21:37 GMT; path=/; domain=.typicode.com; HttpOnly; SameSite=Lax\"]",
    "meta": null,
    "operation_type": "RESPONSE",
    "createdAt": "2021-03-02 14:21:37.616803"
}

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
            httpIntegration: HttpIntegration

        beforeEach(function () {
            httpIntegration = new HttpIntegration()
            tracer = new Tracer()
            tracesLoader = new TracesLoader()
            httpIntegration.init(tracer, tracesLoader, {})
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


    describe('debug mode', function () {
        let tracer: Tracer,
            tracesLoader: TracesLoader,
            httpIntegration: HttpIntegration

        beforeEach(function () {
            process.env.REBUGIT_ENV = Environments.DEBUG
            httpIntegration = new HttpIntegration()
            tracer = new Tracer()
            tracesLoader = new TracesLoader()
            tracesLoader.load([fakeTrace])
            httpIntegration.init(tracer, tracesLoader, {})
        });

        afterEach(function () {
            httpIntegration.end()
            delete process.env.REBUGIT_ENV
        });

        it('should mock readable stream', function (done) {
            const options = {
                host: REQUEST_BASE_URL,
                path: `/${PATH}`,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            const req = https.request(options, (res) => {
                res.setEncoding('utf8');
                let output = '';

                res.on("readable", () => {
                    let chunk;
                    while(null !== (chunk = res.read())){
                        output += chunk;
                    }
                });

                res.on('end', () => {
                    let obj = JSON.parse(output);
                    expect(obj).toEqual(RESPONSE_BODY)
                    done()
                });
            });

            req.end();
        });

        it('should mock data event', function (done) {
            const options = {
                host: REQUEST_BASE_URL,
                path: `/${PATH}`,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            const req = https.request(options, (res) => {
                res.setEncoding('utf8');
                let output = '';

                res.on('data', (chunk) => {
                    output += chunk;
                });

                res.on('end', () => {
                    let obj = JSON.parse(output);
                    expect(obj).toEqual(RESPONSE_BODY)
                    done()
                });
            });

            req.end();
        })
    });
});