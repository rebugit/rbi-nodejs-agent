const integrations = require('./integrations')
const {ErrorDomain} = require("./trace/ErrorDomain");
const {ExpressIntegration} = require("./integrations/expressIntegration");
const {TracesLoader} = require("./trace/TracesLoader");
const {TraceServiceApi} = require("./trace/Api");
const {Tracer} = require("./trace/Tracer");
const logger = require('./logger')

class RebugitSDK {
    /**
     * Config object
     * @param {string} apiKey
     */
    constructor({apiKey}) {
        this.config = {}
        this.api = new TraceServiceApi({apiKey})
        this.tracesLoader = new TracesLoader()
        this.integrations = new Map()
        this.env = process.env.REBUGIT_ENV || 'dev'
        logger.info(`Environment: ${this.env}`)
    }

    _initIntegrations(tracer) {
        for (const key of Object.keys(integrations)) {
            const Integration = integrations[key];
            if (Integration) {
                const instance = new Integration(tracer, this.tracesLoader, this.config);
                this.integrations.set(key, instance)
                logger.info(`wrap ${key} integration`)
            }
        }
    }

    _endIntegrations() {
        for (const [key, instance] of this.integrations.entries()) {
            instance.end()
            logger.info(`unwrap ${key} integration`)
        }
    }

    Handlers() {
        return {
            /**
             * Framework integration, **must be after body parser**
             * @returns {function(*, *, *): Promise<void>}
             * @param {{}} config we can add extra properties here, in order to avoid grab the whole object
             */
            requestHandler: (config) => async (req, res, next) => {
                const tracer = new Tracer()
                const expressIntegration = new ExpressIntegration()
                this._initIntegrations(tracer)

                logger.info(`init handler with traceId: ${tracer.traceId}`)

                // Clean up all wrapped modules
                res.on("finish", () => {
                    this._endIntegrations()
                    logger.info("end request")
                });

                if (this.env === 'debug') {
                    const traces = await this.api.findByTraceId()
                    this.tracesLoader.load(traces)
                    logger.info(`traces loaded in memory`)
                    const correlationId = expressIntegration.getCorrelationId(req)
                    const span = this.tracesLoader.get(correlationId);
                    expressIntegration.injectSpanToRequest(req, span)
                    logger.info(`handler trace injected into request object`)

                    this._initIntegrations(tracer)

                    return next()
                }

                const span = expressIntegration.getSpan(tracer.traceId, req);
                tracer.addSpan(span)
                res.locals['rebugit-context'] = {tracer};
                next()
            },

            errorHandler: ({Sentry}) => (err, req, res, next) => {
                this._endIntegrations()

                if (this.env === 'debug') {
                    return next(err)
                }

                const rebugitContext = res.locals['rebugit-context'];

                if (Sentry) {
                    Sentry.setTag("rebugit-traceId", rebugitContext.tracer.traceId);
                }

                delete res.locals['rebugit-context']
                logger.info("CONTEXT", rebugitContext.tracer.traceId)

                const errorDomain = new ErrorDomain(rebugitContext.tracer.traceId, err);

                this.api.createError(rebugitContext.tracer, errorDomain).then()
                next(err)
            }
        }
    }
}

module.exports = {
    RebugitSDK
}
