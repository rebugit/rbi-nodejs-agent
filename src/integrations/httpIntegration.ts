import {Tracer} from "../trace/Tracer";
import {TracesLoader} from "../trace/TracesLoader";
import {IIntegrationConfig} from "../config";
import {IIntegration} from "./index";
import {Integrations} from "./integrations";
import {IncomingHttpHeaders, IncomingMessage, RequestOptions} from "http";
import {HttpMock} from "./mocks/http";

const url = require("url");
const events = require("events");
const shimmer = require("shimmer");
const {Trace} = require('../trace/Trace')
const logger = require('../logger')

interface IHttpTraceData {
    body: any
    headers: IncomingHttpHeaders,
    statusCode: number,
    statusMessage: string
}

export class HttpIntegration extends Integrations implements IIntegration {
    private tracer: Tracer;
    private tracesLoader: TracesLoader;
    private config: IIntegrationConfig;
    private readonly namespace: string;
    private _http: null;
    private _https: null;
    private readCounter: number;

    constructor() {
        super()
        this.namespace = 'httpIntegration'
        this._http = null
        this._https = null
        this.readCounter = 0
    }

    public init(tracer: Tracer, tracesLoader: TracesLoader, config: IIntegrationConfig) {
        this.tracer = tracer
        this.tracesLoader = tracesLoader
        this.config = config || {}

        const http = this.require("http");
        if (http) {
            this._http = http
            shimmer.wrap(http, 'request', this.wrap());
            logger.info(`wrap http integration`, this.namespace)
        }

        const https = this.require("https");
        if (https) {
            this._https = https
            shimmer.wrap(https, 'request', this.wrap());
            logger.info(`wrap https integration`, this.namespace)
        }
    }

    private getExtraFieldsFromRes(res: IncomingMessage, data: IHttpTraceData) {
        if (this.config.extraFields) {
            this.config.extraFields.forEach(field => {
                data[field] = res[field]
            })
        }
    }

    private addExtraFieldsToRes(res: IncomingMessage, data: IHttpTraceData) {
        if (this.config.extraFields) {
            this.config.extraFields.forEach(field => {
                res[field] = data[field]
            })
        }
    }

    private getMockedRequestObj(httpMock: HttpMock, correlationId: string) {
        const data = this.tracesLoader.get<IHttpTraceData>(correlationId);
        logger.info(`trace loaded: ${data}`, this.namespace)
        const __self = this
        const emitter = new events.EventEmitter()
        const resMock = httpMock.createResponse(emitter);

        /**
         * This is for support of readable stream, usually the caller will
         * call in loop the .read method until EOF (null value). This counter is an hack
         * to return null and stop the iteration.
         */
        resMock.read = function () {
            if (__self.readCounter === 1) {
                __self.readCounter = 0
                return null
            }
            __self.readCounter++
            return Buffer.from(data.body)
        }

        // @ts-ignore
        resMock.on = function (type, cb) {
            if (type === 'data') {
                cb(Buffer.from(data.body))
            }

            if (type === 'end') {
                cb()
            }

            if (type === 'readable') {
                cb()
            }

            if (type === 'headers'){
                cb(200, {}, "OK")
            }
        }
        // @ts-ignore
        resMock.once = function (type, cb) {
            console.log(type)
            if (type === 'end') {
                cb()
            }
        }

        resMock.statusCode = data.statusCode
        resMock.headers = data.headers
        resMock.statusMessage = data.statusMessage
        this.addExtraFieldsToRes(resMock, data)

        return resMock
    }

    private wrap() {
        const integration = this
        return (request) => {
            return function () {
                let options: RequestOptions | any = arguments[0];
                const method = (options.method || 'GET').toUpperCase();
                const host = options.hostname || options.host || 'localhost'
                options = typeof options === 'string' ? url.parse(options) : options;
                let path = options.path || options.pathname || '/';
                const headers = options.headers
                const correlationId = integration.getCorrelationId(method, host, path, headers);

                logger.info(`correlation id: ${correlationId}`, integration.namespace)

                let originalCallback
                if (options.callback) {
                    originalCallback = options.callback
                } else { // @ts-ignore
                    if (typeof arguments[1] === "function") {
                        originalCallback = arguments[1]
                    } else if (arguments[2] && typeof arguments[2] === 'function') {
                        originalCallback = arguments[2]
                    }
                }

                try {
                    if (integration.env === 'debug') {
                        const httpMock = new HttpMock()
                        const resMock = integration.getMockedRequestObj(httpMock, correlationId);

                        const wrappedCallback = () => {
                            originalCallback(resMock)
                        };

                        if (!originalCallback) {
                            return httpMock.request.call(this, resMock, function () {})
                        }

                        return httpMock.request.call(this, options, wrappedCallback)
                    } else {
                        const wrappedCallback = (res: IncomingMessage) => {
                            let output = '';

                            res.on('data', (chunk) => {
                                output += chunk;
                            });

                            res.on('end', () => {
                                const data: IHttpTraceData = {
                                    body: output,
                                    headers: res.headers,
                                    statusCode: res.statusCode,
                                    statusMessage: res.statusMessage
                                }

                                integration.getExtraFieldsFromRes(res, data)

                                const obj = {
                                    data,
                                    correlationId,
                                }

                                const trace = new Trace(obj);
                                integration.tracer.add(trace.trace())
                            });

                            if (originalCallback) {
                                originalCallback(res)
                            }
                        };

                        return request.call(this, options, wrappedCallback);
                    }
                } catch (error) {
                    logger.error(error, integration.namespace)
                    return request.apply(this, arguments);
                }
            };
        }
    }

    end(): void {
        if (this._http) {
            shimmer.unwrap(this._http, 'request');
            logger.info(`unwrap http integration`, this.namespace)
        }

        if (this._https) {
            shimmer.unwrap(this._https, 'request');
            logger.info(`unwrap https integration`, this.namespace)
        }
    }

    private wrapGot() {
        const integration = this
        return (request) => {
            return function () {
                console.log("CALLED")
            };
        }

    }
}


module.exports = {
    HttpIntegration
}
