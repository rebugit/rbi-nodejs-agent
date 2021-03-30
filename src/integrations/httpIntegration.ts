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

    constructor() {
        super()
        this.namespace = 'httpIntegration'
        this._http = null
        this._https = null
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

    private getRequestObj(httpMock: HttpMock, correlationId: string) {
        const data = this.tracesLoader.get<IHttpTraceData>(correlationId);
        logger.info(`correlationId: ${correlationId}`, this.namespace)
        logger.info(`trace loaded: ${data}`, this.namespace)

        const emitter = new events.EventEmitter()
        const resMock = httpMock.createResponse(emitter);

        // @ts-ignore
        resMock.on = function (type, cb) {
            if (type === 'data') {
                cb(Buffer.from(data.body))
            }

            if (type === 'end') {
                cb()
            }
        }
        // @ts-ignore
        resMock.once = function (type, cb) {
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
                options = typeof options === 'string' ? url.parse(options) : options;
                let path = options.path || options.pathname || '/';
                const correlationId = integration.getCorrelationId(method, path);

                let originalCallback
                if (options.callback) {
                    originalCallback = options.callback
                } else { // @ts-ignore
                    if (typeof arguments[1] === "function") {
                        originalCallback = arguments[1]
                    } else if (arguments[2] && typeof arguments[2] === 'function'){
                        originalCallback = arguments[2]
                    }
                }

                try {
                    if (integration.env === 'debug') {
                        const httpMock = new HttpMock()
                        const resMock = integration.getRequestObj(httpMock, correlationId);

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
