const axios = require('axios')

class TraceServiceApi {
    constructor() {
        const BASE_URL = process.env.CARPE_DIEM_BASE_URL || 'http://localhost:8080'
        const TENANT_ID = 'd0b38056-4ebf-4ba1-85e1-1499eaf1e42a' // for now hardcoded
        this.baseUrl = BASE_URL
        this.tenantId = TENANT_ID
    }

    async createMany(tracer) {
        try {
            const options = {
                method: 'POST',
                data: {
                    traces: tracer.spans()
                },
                url: `${this.baseUrl}/tenants/${this.tenantId}/traces`,
            };

            const resp = await axios(options)
            console.log(resp.data)
        } catch (e) {
            console.log(e.message)
            // no-op
        }
    }

    async findByTraceId(traceId = process.env.CARPE_DIEM_TRACE_ID) {
        const options = {
            method: 'GET',
            url: `${this.baseUrl}/tenants/${this.tenantId}/traces/${traceId}`,
        };

        const resp = await axios(options)
        return resp.data
    }
}

module.exports = {
    TraceServiceApi
}
