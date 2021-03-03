import {IIntegrationConfig} from "../config";
import {Tracer} from "../trace/Tracer";
import {TracesLoader} from "../trace/TracesLoader";
import {IIntegration} from "./index";
import {QueryResult} from "pg";
import {stringify} from "flatted";
import {Trace} from "../trace/Trace";

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

        this.handleResponse = this.handleResponse.bind(this);
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
                    const statement = integration.getStatement(newArgs);
                    const correlationId = integration.hashSha1(statement);

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
                        // Inject callback
                        newArgs[callbackIndex] = (err: any, value: QueryResult) => {
                            const queryResult = integration.handleResponse(value, correlationId);
                            originalCallback(err, queryResult)
                        };
                    }

                    const result = query.apply(this, newArgs);

                    if (result && typeof result.then === 'function') {
                        result.then(function (value: QueryResult) {
                            return integration.handleResponse(value, correlationId)
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

    private handleResponse(value: QueryResult, correlationId: string): QueryResult {
        if (this.env === 'debug') {


            return value

        } else {
            const data = {
                value: value.rows
            }

            this.getExtraFieldsFromRes(value, data)

            const trace = new Trace({
                operationType: 'QUERY',
                correlationId,
                data: stringify(data)
            })

            this.tracer.add(trace.trace())

            return value;
        }
    }

    /**
     * Depending who is calling the query method the statement argument
     * may appears in different order
     */
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

    /**
     * Replace all query parameters
     * Ex: SELECT 1 + $1 AS result, [4] => SELECT 1 + 5 AS result
     */
    private replaceArgs(statement: string, values: any[]): string {
        const args = Array.prototype.slice.call(values);
        const replacer = (value: string) => args[parseInt(value.substr(1), 10) - 1];

        return statement.replace(/(\$\d+)/gm, replacer);
    }

    private getExtraFieldsFromRes(res: QueryResult, data: any) {
        if (this.config.extraFields) {
            this.config.extraFields.forEach(field => {
                data[field] = res[field]
            })
        }
    }

    private addExtraFieldsToRes(res: QueryResult, data: any) {
        if (this.config.extraFields) {
            this.config.extraFields.forEach(field => {
                res[field] = data[field]
            })
        }
    }

    end() {
        if (this._pg) {
            shimmer.unwrap(this._pg.Client.prototype, 'query')
        }
    }
}
