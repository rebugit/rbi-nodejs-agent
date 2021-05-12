import crypto from 'crypto'
import {OperationsType} from "./constants";

export class Integrations {
    protected env: any;
    private _counter: number;

    constructor() {
        this.env = process.env.REBUGIT_ENV || 'dev'
        this._counter = 0
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

    protected getCorrelationId = (method: string, host: string, path: string, headers: { [key: string]: string }): string => {
        if (host.includes('amazonaws.com')) {
            this._counter++
            const target = headers['X-Amz-Target'];
            return `${method}_${host}${path || ''}_${target}_${this._counter}`
        }

        this._counter++
        return `${method}_${host}${path}_${this._counter}`
    }

    protected getOperationType = (host: string): string => {
        if (host.includes('amazonaws.com')) {
            const service = host.split(".")[0];
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
