const {v4: uuidV4} = require('uuid');

class Tracer {
    get tenantId() {
        return this._tenantId;
    }

    get traceId() {
        return this._traceId;
    }

    constructor(tenantId) {
        const _tenantId = process.env.CARPE_DIEM_TENANT_ID

        this._traceId = uuidV4()
        this._tenantId = 'd0b38056-4ebf-4ba1-85e1-1499eaf1e42a'
        this._spans = []
    }

    addSpan(span) {
        this._spans.push({
            traceId: this._traceId,
            tenantId: this._tenantId,
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
