import crypto from 'crypto'
import {OperationsType} from "./constants";
import {IncomingHttpHeaders, OutgoingHttpHeaders} from "http";

export class Integrations {
    protected env: any;

    constructor() {
        this.env = process.env.REBUGIT_ENV || 'dev'
    }

    private static isModulePresent(moduleName): string | undefined {
        try {
            return require.resolve(moduleName)
        } catch (e) {
            return undefined
        }
    }

    protected require(moduleName): any | undefined {
        const module = Integrations.isModulePresent(moduleName);
        if (module) {
            return require(module)
        }
    }

    protected isAWSRequest(host: string, headers: OutgoingHttpHeaders): boolean {
        return !!(host.includes('amazonaws.com') || headers['X-Amz-Target']);
    }

    private getAWSCorrelationId(method: string, host: string, path: string, headers: OutgoingHttpHeaders): string {
        const target = headers['X-Amz-Target'];
        const signedPayload = headers['X-Amz-Content-Sha256'] as string
        return `${method}_${host}${path || ''}_${target}_${signedPayload}`
    }

    private getStandardCorrelationId = (method: string, host: string, path: string, headers: OutgoingHttpHeaders, body: string): string => {
        if (body) {
            return `${method}_${host}${path}_${this.hashSha1(body)}`
        }

        return `${method}_${host}${path}`
    }

    // TODO change correlationId calculation
    protected getCorrelationId = (method: string, host: string, path: string, headers: OutgoingHttpHeaders, body: string): string => {
        if (this.isAWSRequest(host, headers)) {
            return this.getAWSCorrelationId(method, host, path, headers)
        }

        return this.getStandardCorrelationId(method, host, path, headers, body)
    }

    protected getOperationType = (headers: OutgoingHttpHeaders): string => {
        if (headers['X-Amz-Target']) {
            const service = (headers['X-Amz-Target'] as string).split("_")[0];
            return service.toUpperCase()
        }

        return OperationsType.RESPONSE
    }

    protected hashSha1 = (value: string): string => {
        const hash = crypto.createHash('sha1')
        hash.update(value)
        return hash.digest('hex')
    }
}
