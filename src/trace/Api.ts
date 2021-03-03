import {RequestOptions} from "https";
import {ITrace} from "./Trace";
import {ErrorDomain, IErrorDomain} from "./ErrorDomain";
import {Tracer} from "./Tracer";

const https = require('https')
const logger = require('../logger')

interface ITraceServiceApi {
    findByTraceId(traceId: string): Promise<ITrace[]>
    createError(tracer, error): Promise<void>
}

interface IApiResponse<T> {
    data: T
}

interface IData {
    traces: ITrace[]
    error: IErrorDomain
}

export class TraceServiceApi implements ITraceServiceApi {
    private readonly host: string;
    private readonly token: string;
    private readonly apiKey: string;

    constructor({apiKey}) {
        const host = 'localhost' // TODO: substitute with live application host
        this.host = process.env.REBUGIT_BASE_URL || host
        this.token = process.env.REBUGIT_TOKEN || ''
        this.apiKey = process.env.REBUGIT_API_KEY || apiKey
    }

    async createError(tracer: Tracer, error: ErrorDomain): Promise<void> {
        try {
            const data = {
                traces: tracer.traces,
                error: error.getError()
            }

            const resp = await this._post('/traces', data)
            logger.info(`create error response: ${resp.data}`)
        } catch (e) {
            logger.error(e)
            // no-op
        }
    }

    async findByTraceId(traceId = process.env.REBUGIT_TRACE_ID): Promise<ITrace[]> {
        const resp = await this._get(`/traces/${traceId}`)
        return resp.data
    }

    private async _post(path: string, data: IData): Promise<IApiResponse<string>> {
        const options: RequestOptions = {
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

    private async _get(path: string): Promise<IApiResponse<ITrace[]>> {
        const options: RequestOptions = {
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

    private async _request<T>(options: RequestOptions, data?: IData): Promise<T> {
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
                    let parsedBody: T
                    try {
                        // @ts-ignore
                        parsedBody = JSON.parse(body);
                    } catch (e) {
                        reject(e);
                    }
                    resolve(parsedBody);
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
