import {IIntegration} from "./integrations";
import {TraceServiceApi} from "./trace/Api";
import {TracesLoader} from "./trace/TracesLoader";
import {IGlobalConfig} from "./config";
import {CustomIntegration} from "./integrations/customIntegration";
import {Tracer} from "./trace/Tracer";

const integrations = require('./integrations')
const {ErrorDomain} = require("./trace/ErrorDomain");
const {HttpHandlerIntegration} = require("./integrations/httpHandlerIntegration");
const logger = require('./logger')

class RebugitSDK {
    private readonly config: IGlobalConfig;
    private api: TraceServiceApi;
    private readonly tracesLoader: TracesLoader;
    private integrations: Map<string, IIntegration>;
    private readonly env: string;
    private tracer: Tracer;

    constructor(config: IGlobalConfig) {
        this.config = config
        this.api = new TraceServiceApi({apiKey: config.apiKey})
        this.tracesLoader = new TracesLoader()
        this.integrations = new Map()
        this.env = process.env.REBUGIT_ENV || 'dev'
        logger.info(`Environment: ${this.env}`)
    }

    _initIntegrations(tracer) {
        for (const key of Object.keys(integrations)) {
            const Integration = integrations[key];
            if (Integration) {
                const instance: IIntegration = new Integration();
                const config = this.config.integrationsConfig && this.config.integrationsConfig[key]
                instance.init(tracer, this.tracesLoader, config)
                this.integrations.set(key, instance)
                logger.info(`wrap ${key} integration`)
            }
        }

        const customIntegrations = this.config.customIntegrations || {}

        for (const key of Object.keys(customIntegrations)) {
            const instance: IIntegration = new CustomIntegration(customIntegrations[key])
            instance.init(tracer, this.tracesLoader, {})
            this.integrations.set(key, instance)
            logger.info(`wrap ${key} integration`)
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
                this.tracer = tracer
                const handlerIntegration = new HttpHandlerIntegration()

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
                    const correlationId = handlerIntegration.getCorrelationId(req)
                    const span = this.tracesLoader.get(correlationId);
                    handlerIntegration.injectTraceToRequest(req, span)
                    logger.info(`handler trace injected into request object`)

                    this._initIntegrations(tracer)

                    return next()
                } else {

                    this._initIntegrations(tracer)
                    const span = handlerIntegration.getTrace(tracer.traceId, req);
                    tracer.add(span)
                    next()
                }
            },

            errorHandler: ({Sentry}) => (err, req, res, next) => {
                this._endIntegrations()

                if (this.env === 'debug') {
                    return next(err)
                }

                if (Sentry) {
                    Sentry.setTag("rebugit-traceId", this.tracer.traceId);
                }

                const errorDomain = new ErrorDomain(this.tracer.traceId, err);
                this.api.createError(this.tracer, errorDomain).then()
                logger.info(`Ending trace with traceId: ${this.tracer.traceId}`)
                this.clean()
                next(err)
            }
        }
    }

    private clean(){
        this.tracer = null
    }
}

module.exports = {
    RebugitSDK
}
