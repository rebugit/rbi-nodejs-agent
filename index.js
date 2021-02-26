const http = require('http')
const shimmer = require('shimmer');
const {ErrorDomain} = require("./trace/ErrorDomain");
const {ExpressIntegration} = require("./integrations/expressIntegration");
const {TracesLoader} = require("./trace/TracesLoader");
const {TraceServiceApi} = require("./trace/Api");
const {HttpIntegration} = require("./integrations/httpIntegration");
const {Tracer} = require("./trace/Tracer");

const api = new TraceServiceApi()
const tracesLoader = new TracesLoader()

/**
 * Example express integration, **must be after body parser**
 * @returns {function(*, *, *): Promise<void>}
 * @param {{}} config we can add extra properties here, in order to avoid grab the whole object
 */
const expressMiddleware = (config) => async (req, res, next) => {
    const tracer = new Tracer()
    const expressIntegration = new ExpressIntegration()
    const httpIntegration = new HttpIntegration(tracer, tracesLoader, {extraFields: ['httpVersion']});

    // Clean up all wrapped modules
    res.on("finish", function (e) {
        shimmer.unwrap(http, 'request');
        console.log("FINISHED")
    });

    if (process.env.REBUGIT_ENV === 'debug') {
        const traces = await api.findByTraceId()
        tracesLoader.load(traces)
        // Inject execution
        const correlationId = expressIntegration.getCorrelationId(req)
        const span = tracesLoader.get(correlationId);
        expressIntegration.injectSpanToRequest(req, span)

        shimmer.wrap(http, 'request', httpIntegration.wrap());

        return next()
    }

    shimmer.wrap(http, 'request', httpIntegration.wrap());

    const span = expressIntegration.getSpan(tracer.traceId, req);
    tracer.addSpan(span)
    res.locals['rebugit-context'] = {tracer};
    next()
}

const expressErrorHandler = ({Sentry}) => (err, req, res, next) => {
    // COMMENT: maybe we should unwrap two times, but we must unwrap before we send the request
    // TODO: revisit this

    if (process.env.REBUGIT_ENV === 'debug') {
        return next(err)
    }

    shimmer.unwrap(http, 'request');

    const rebugitContext = res.locals['rebugit-context'];

    if (Sentry){
        Sentry.setTag("rebugit-traceId", rebugitContext.tracer.traceId);
    }

    delete res.locals['rebugit-context']
    console.log("CONTEXT", rebugitContext.tracer.traceId)

    const errorDomain = new ErrorDomain(rebugitContext.tracer.traceId, err);

    api.createError(rebugitContext.tracer, errorDomain).then()
    next(err)
}

class RebugitSDK {
    /**
     * Config object
     * @param {string} apiKey
     */
    constructor({apiKey}) {

    }

    initIntegrations(){

    }

    endIntegrations(){

    }
}

module.exports = {
    expressMiddleware,
    expressErrorHandler
}
