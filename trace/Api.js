const https = require('https')

class TraceServiceApi {
    constructor({apiKey}) {
        const host = 'localhost'
        this.host = process.env.REBUGIT_BASE_URL || host
        this.token = process.env.REBUGIT_TOKEN
        this.apiKey = process.env.REBUGIT_API_KEY || apiKey
    }

    async createError(tracer, error) {
        try {
            const data = {
                traces: tracer.spans(),
                error: error.getError()
            }

            const resp = await this._post('/traces', data)
            console.log(resp.data)
        } catch (e) {
            console.log("error", e.message)
            // no-op
        }
    }

    async findByTraceId(traceId = process.env.REBUGIT_TRACE_ID) {
        const resp = await this._get(`/traces/${traceId}`)
        return resp.data
    }

    async _post(path, data) {
        const options = {
            hostname: this.host,
            port: 443,
            path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                "x-rebugit-apikey": this.apiKey
            }
        }

        return this._request(options, data)
    }

    async _get(path) {
        const options = {
            hostname: this.host,
            port: 443,
            path,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                "x-rebugit-apikey": this.apiKey,
                Authorization: this.token,
            }
        }

        return this._request(options)

    }

    async _request(options, data) {
        return new Promise((resolve, reject) => {
            const req = https.request(options, res => {
                res.setEncoding('utf8');

                if (res.statusCode < 200 || res.statusCode >= 300) {
                    return reject(new Error('statusCode=' + res.statusCode));
                }

                let body = [];
                res.on('data', function (chunk) {
                    body.push(chunk);
                });

                res.on('end', function () {
                    try {
                        body = JSON.parse(body);
                    } catch (e) {
                        reject(e);
                    }
                    resolve(body);
                });
            })

            req.on('error', function (err) {
                reject(err);
            });

            if (data) {
                req.write(JSON.stringify(data));
            }

            req.end();
        })
    }
}

module.exports = {
    TraceServiceApi
}
