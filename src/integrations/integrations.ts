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

    protected getCorrelationId = (method: string, host: string, path: string): string => {
        this._counter++
        return `${method}_${host}_${path}_${this._counter}`
    }
}
