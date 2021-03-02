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
const {stringify} = require('flatted');
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

    private wrap() {
        const integration = this
        return (request) => {
            return (options: RequestOptions, callback) => {
                const method = (options.method || 'GET').toUpperCase();
                options = typeof options === 'string' ? url.parse(options) : options;
                const host = options.hostname || options.host || 'localhost';
                // @ts-ignore
                let path = options.path || options.pathname || '/';
                const correlationId = this.getCorrelationId(method, host, path);

                try {
                    if (integration.env === 'debug') {
                        const data = this.tracesLoader.get<IHttpTraceData>(correlationId);
                        logger.info(`correlationId: ${correlationId}`, this.namespace)
                        logger.info(`trace loaded: ${data}`, this.namespace)

                        const httpMock = new HttpMock()

                        const wrappedCallback = () => {
                            const emitter = new events.EventEmitter()
                            const resMock = httpMock.createResponseMock(emitter);

                            process.nextTick(() => {
                                resMock.emit('data', data.body)
                                resMock.emit('end')
                            })

                            resMock.statusCode = data.statusCode
                            resMock.headers = data.headers
                            resMock.statusMessage = data.statusMessage
                            this.addExtraFieldsToRes(resMock, data)

                            // TODO: there is some error here:
                            // Cannot read property 'aborted' of undefined TypeError: Cannot read property 'aborted' of undefined
                            // however everything goes forward normally
                            callback(resMock)
                        };

                        return httpMock.mockRequest(null, wrappedCallback)
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

                                this.getExtraFieldsFromRes(res, data)

                                const obj = {
                                    data: stringify(data),
                                    correlationId,
                                }

                                const trace = new Trace(obj);
                                this.tracer.add(trace.trace())
                            });

                            callback(res)
                        };

                        return request.call(this, options, wrappedCallback);
                    }
                } catch (error) {
                    logger.error(error, integration.namespace)
                    return request.apply(this, [options, callback]);
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
}


module.exports = {
    HttpIntegration
}
