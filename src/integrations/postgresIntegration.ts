import {IIntegrationConfig} from "../config";
import {Tracer} from "../trace/Tracer";
import {TracesLoader} from "../trace/TracesLoader";
import {IIntegration} from "./index";

const shimmer = require("shimmer");
const logger = require('../logger')
const {Integrations} = require("./integrations");

export class PostgresIntegration extends Integrations implements IIntegration {
    private tracer: Tracer;
    private tracesLoader: TracesLoader;
    private env: string;
    private config: IIntegrationConfig;
    private namespace: string;
    private _pg: any;

    constructor() {
        super()

        this.env = process.env.REBUGIT_ENV
        this.namespace = 'pgIntegration'
    }

    init(tracer: Tracer, tracesLoader: TracesLoader, config: IIntegrationConfig) {
        this.tracer = tracer
        this.tracesLoader = tracesLoader
        this.config = config || {}

        const pg = this.require("pg");
        if (pg) {
            this._pg = pg
            shimmer.wrap(pg.Client.prototype, 'query', this.wrap())
        }
    }

    /**
     * Example pg library wrapper, this works for Sequelize as well
     * @returns {function(*): function(*=, *=): Promise<undefined|*>}
     */
    private wrap() {
        const integration = this
        return function (query) {
            return function (...args): any {
                try {
                    const newArgs = [...args];
                    console.log("ARGS", newArgs)
                    const statement = integration.getStatement(newArgs);
                    console.log("STATEMENT: ", statement)
                    let originalCallback: any;
                    let callbackIndex = -1;

                    for (let i = 1; i < newArgs.length; i++) {
                        if (typeof newArgs[i] === 'function') {
                            originalCallback = newArgs[i];
                            callbackIndex = i;
                            break;
                        }
                    }

                    if (callbackIndex >= 0) {
                        const wrappedCallback = (err: any, res: any) => {
                            console.log("CALLBACK: ", err, res)
                            originalCallback(err, res)
                        };
                        newArgs[callbackIndex] = wrappedCallback;
                    }

                    const result = query.apply(this, newArgs);
                    console.log("FUNCTION", result)
                    if (result && typeof result.then === 'function') {
                        result.then(function (value: any) {
                            console.log("VALUE: ", value)
                            return value;
                        }).catch(function (error: any) {
                            console.log("ERROR: ", error)
                            return error;
                        });
                    }

                    return result;
                } catch (error) {
                    // @ts-ignore
                    console.log(error.message, error.stack)
                    return query.apply(this, args);
                }
            };
        }
    }

    private getStatement(args: any[]) {
        let text;
        let values;

        if (typeof args[0] === 'string') {
            text = args[0];
        } else if (typeof args[0] === 'object') {
            text = args[0].text;
        }

        if (args[1] instanceof Array) {
            values = args[1];
        } else if (typeof args[0] === 'object') {
            values = args[0].values;
        }

        if (values) {
            text = this.replaceArgs(text, values);
        }

        return text;
    }

    private replaceArgs(statement: string, values: any[]): string {
        const args = Array.prototype.slice.call(values);
        const replacer = (value: string) => args[parseInt(value.substr(1), 10) - 1];

        return statement.replace(/(\$\d+)/gm, replacer);
    }

    end() {
        if (this._pg) {
            shimmer.unwrap(this._pg.Client.prototype, 'query')
        }
    }
}
