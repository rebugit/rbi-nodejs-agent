const events = require("events");
const {parse, stringify} = require('flatted');
const {Span} = require('../trace/Span')

/**
 * @typedef {{extraFields: string[]}} Config
 */

class HttpIntegration {
    /**
     *
     * @param tracer
     * @param tracesLoader
     * @param {Config} config
     */
    constructor(tracer, tracesLoader, config) {
        this.tracer = tracer
        this.tracesLoader = tracesLoader
        this.REBUGIT_ENV = process.env.REBUGIT_ENV
        this.config = config || []
    }

    getCorrelationId = (method, host, path) => {
        return `${method}_${host}_${path}`
    }

    setExtraFields(res, data){
        this.config.extraFields.forEach(field => {
            data[field] = res[field]
        })
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
                    if (this.REBUGIT_ENV === 'debug') {
                        const data = this.tracesLoader.get(correlationId);
                        const wrappedCallback = (res) => {
                            const customRes = new events.EventEmitter()
                            customRes.setEncoding = function () {}

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
                                }
                            );

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
                    console.log(error.message, error.stack)
                    return request.apply(this, [options, callback]);
                }
            };
        }
    }
}


module.exports = {
    HttpIntegration
}
