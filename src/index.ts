import {IIntegration} from "./integrations";
import {TraceServiceApi} from "./trace/Api";
import {TracesLoader} from "./trace/TracesLoader";
import {IGlobalConfig} from "./config";
import {CustomIntegration} from "./integrations/customIntegration";
import {Tracer} from "./trace/Tracer";
import {Environments} from "./sharedKernel/constants";
import {Callback, Context} from "aws-lambda"
import {LambdaIntegration} from "./integrations/lambdaIntegration";


const integrations = require('./integrations')
const {ErrorDomain} = require("./trace/ErrorDomain");
const {HttpHandlerIntegration} = require("./integrations/httpHandlerIntegration");
const logger = require('./logger')

class RebugitSDK {
    private readonly config: IGlobalConfig;
    private readonly api: TraceServiceApi;
    private readonly tracesLoader: TracesLoader;
    private integrations: Map<string, IIntegration>;
    private readonly env: string;
    private tracer: Tracer;
    private lambdaIntegration: LambdaIntegration;

    constructor(config: IGlobalConfig) {
        this.config = config
        this.api = new TraceServiceApi({
            apiKey: config.apiKey,
            collectorBaseUrl: config.collector && config.collector.collectorBaseUrl
        })
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
        }
    }

    _endIntegrations() {
        for (const [_, instance] of this.integrations.entries()) {
            instance.end()
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

                if (this.env === Environments.DEBUG) {
                    const traces = await this.api.findByTraceId()
                    this.tracesLoader.load(traces)
                    logger.info(`traces loaded in memory`)
                    const correlationId = handlerIntegration.getCorrelationId(req)
                    const span = this.tracesLoader.get(correlationId);
                    logger.info(`correlation id: ${correlationId}`)
                    logger.info(`trace data: ${span}`)
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

            errorHandler: () => (err, req, res, next) => {
                this._endIntegrations()

                if (this.env === Environments.DEBUG) {
                    return next(err)
                }

                const errorDomain = new ErrorDomain(this.tracer.traceId, err);
                this.api.createError(this.tracer, errorDomain).then()
                logger.info(`Ending trace with traceId: ${this.tracer.traceId}`)
                this.clean()
                next(err)
            },
        }
    }

    AWSLambda() {
        return {
            lambdaHandler: (func: (...args: any[]) => any) => {
                const tracer = new Tracer()
                const lambdaIntegration = new LambdaIntegration(tracer, this.tracesLoader, this.api)
                this.lambdaIntegration = lambdaIntegration
                this.tracer = tracer
                logger.info(`init lambda handler with traceId: ${tracer.traceId}`)

                return async (event: any, context: Context, callback: Callback) => {
                    this._initIntegrations(tracer)

                    if (this.env === Environments.DEBUG) {
                        const {context, event} = await lambdaIntegration.extractRequest();
                        return func(event, context)
                    } else {
                        lambdaIntegration.captureRequest({event, context})
                    }

                    if (func.length > 2) {
                        logger.info("wrapping lambda callback")
                        const wrappedCallback = lambdaIntegration.wrapCallback(
                            callback,
                            () => {
                                this._endIntegrations()
                            }
                        )
                        func(event, context, wrappedCallback)
                    } else {
                        logger.info("executing async handler")
                        return lambdaIntegration.asyncHandler(
                            func,
                            {context, event},
                            () => {
                                this._endIntegrations()
                            }
                        )
                    }
                };
            },

            captureError: async (e): Promise<void> => {
                this._endIntegrations()
                return this.lambdaIntegration.captureException(e)
            }
        }
    }

    private clean() {
        this.tracer = null
    }
}

module.exports = {
    RebugitSDK
}
