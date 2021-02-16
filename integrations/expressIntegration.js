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

module.exports = {
    ExpressIntegration
}
