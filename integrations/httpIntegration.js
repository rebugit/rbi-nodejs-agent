const events = require("events");
const shimmer = require("shimmer");
const {Integrations} = require("./integrations");
const {stringify} = require('flatted');
const {Span} = require('../trace/Span')
const logger = require('../logger')

/**
 * @typedef {{extraFields: string[]}} Config
 */

class HttpIntegration extends Integrations {
    /**
     *
     * @param tracer
     * @param tracesLoader
     * @param {Config} config
     */
    constructor(tracer, tracesLoader, config) {
        super()
        this.tracer = tracer
        this.tracesLoader = tracesLoader
        this.env = process.env.REBUGIT_ENV
        this.config = config
        this.namespace = 'httpIntegration'

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

    getCorrelationId = (method, host, path) => {
        return `${method}_${host}_${path}`
    }

    setExtraFields(res, data) {
        if (this.config.extraFields) {
            this.config.extraFields.forEach(field => {
                data[field] = res[field]
            })
        }
    }

    wrap() {
        return (request) => {
            return (options, callback) => {
                const method = (options.method || 'GET').toUpperCase();
                options = typeof options === 'string' ? url.parse(options) : options;
                const host = options.hostname || options.host || 'localhost';
                let path = options.path || options.pathname || '/';
                const correlationId = this.getCorrelationId(method, host, path);

                try {
                    if (this.env === 'debug') {
                        const data = this.tracesLoader.get(correlationId);
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

                                const span = new Span(obj);
                                this.tracer.addSpan(span.span())
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

    end() {
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
