import {Tracer} from "../trace/Tracer";
import {TracesLoader} from "../trace/TracesLoader";
import {IIntegrationConfig} from "../config";
import {IIntegration} from "./index";
import {Integrations} from "./integrations";

const url = require("url");
const events = require("events");
const shimmer = require("shimmer");
const {stringify} = require('flatted');
const {Trace} = require('../trace/Trace')
const logger = require('../logger')

interface IHttpTraceData {
    body: any
    headers: { [key: string]: string },
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
        }

        const https = this.require("https");
        if (https) {
            this._https = https
            shimmer.wrap(https, 'request', this.wrap());
        }
    }

    private getCorrelationId = (method, host, path): string => {
        return `${method}_${host}_${path}`
    }

    private setExtraFields(res, data) {
        if (this.config.extraFields) {
            this.config.extraFields.forEach(field => {
                data[field] = res[field]
            })
        }
    }

    private wrap() {
        return (request) => {
            return (options, callback) => {
                const method = (options.method || 'GET').toUpperCase();
                options = typeof options === 'string' ? url.parse(options) : options;
                const host = options.hostname || options.host || 'localhost';
                let path = options.path || options.pathname || '/';
                const correlationId = this.getCorrelationId(method, host, path);

                try {
                    if (this.env === 'debug') {
                        const data = this.tracesLoader.get<IHttpTraceData>(correlationId);
                        logger.info(`trace loaded: ${data}`, this.namespace)
                        const wrappedCallback = (res) => {
                            const customRes = new events.EventEmitter()
                            customRes.setEncoding = function () {
                            }

                            process.nextTick(() => {
                                customRes.emit('data', data.body)
                                customRes.emit('end')
                            })

                            customRes.statusCode = 200
                            callback(customRes)
                        };

                        return request.call(this, options, wrappedCallback);
                    } else {
                        const wrappedCallback = (res) => {
                            res.setEncoding('utf8');
                            let output = '';

                            res.on('data', (chunk) => {
                                output += chunk;
                            });

                            res.on('end', () => {
                                const data = {
                                    body: output,
                                    headers: res.headers,
                                    statusCode: res.statusMessage,
                                    statusMessage: res.statusMessage
                                }

                                this.setExtraFields(res, data)

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
                    logger.error(error, this.namespace)
                    return request.apply(this, [options, callback]);
                }
            };
        }
    }

    end(): void {
        if (this._http) {
            shimmer.unwrap(this._http, 'request');
        }

        if (this._https) {
            shimmer.unwrap(this._https, 'request');
        }
    }
}


module.exports = {
    HttpIntegration
}
