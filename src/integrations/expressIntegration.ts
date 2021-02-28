const {stringify} = require('flatted');

export class ExpressIntegration {
    getCorrelationId(req) {
        return `${req.method}_${req.originalUrl}`
    }

    getTrace(traceId, req) {
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

    injectSpanToRequest(req, spanData) {
        Object.keys(spanData).forEach(key => {
            req[key] = spanData[key]
        })
    }
}
