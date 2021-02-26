const {v4: uuidV4} = require('uuid');

class Tracer {
    get traceId() {
        return this._traceId;
    }

    constructor(tenantId) {
        this._traceId = uuidV4()
        this._spans = []
    }

    addSpan(span) {
        this._spans.push({
            traceId: this._traceId,
            ...span
        })
    }

    spans() {
        return this._spans
    }
}

module.exports = {
    Tracer
}
