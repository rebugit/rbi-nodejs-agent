const {stringify} = require('flatted');

export class HttpHandlerIntegration {
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

    injectTraceToRequest(req, spanData) {
        Object.keys(spanData).forEach(key => {
            req[key] = spanData[key]
        })
    }
}
