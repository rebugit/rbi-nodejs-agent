const {parse, stringify} = require('flatted');

class ExpressIntegration {
    getCorrelationId(req) {
        return `${req.method}_${req.originalUrl}`
    }

    getSpan(traceId, req) {
        return {
            data: stringify({
                body: req.body,
                headers: req.headers,
                originalUrl: req.originalUrl,
                user: req.user
            }),
            correlationId: this.getCorrelationId(req),
            operationType: "REQUEST"
        }
    }

    /**
     *
     * @param req
     * @param {{body: any, headers: any}} spanData
     */
    injectSpanToRequest(req, spanData){
        Object.keys(spanData).forEach(key => {
            req[key] = spanData[key]
        })
    }
}


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


module.exports = {
    ExpressIntegration,
    expressMiddleware
}
