import {IIntegrationConfig} from "../config";
import {Tracer} from "../trace/Tracer";
import {TracesLoader} from "../trace/TracesLoader";
import {IIntegration} from "./index";
import {QueryResult} from "pg";
import {Environments} from "../sharedKernel/constants";
import path from "path";
import {Trace} from "../trace/Trace";
import {OperationsType} from "./constants";
import {Connection, FieldInfo, MysqlError, queryCallback, QueryOptions} from "mysql";

const shimmer = require("shimmer");
const logger = require('../logger')
const {Integrations} = require("./integrations");

interface IQueryData {
    response: any
    fields?: any
}

interface IParsedArgs {
    statement: string;
    values: any[] | undefined;
    originalCallback: queryCallback;
}

export class MysqlIntegration extends Integrations implements IIntegration {
    private tracer: Tracer;
    private tracesLoader: TracesLoader;
    private readonly env: string;
    private config: IIntegrationConfig;
    private readonly namespace: string;
    private _mysqlConnection: Connection;
    private _mysql: any;

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

        this.wrapMockConnect = this.wrapMockConnect.bind(this);

        const mysqlConnection = this.require(path.join("mysql", "lib/Connection"));
        if (mysqlConnection) {
            this._mysqlConnection = mysqlConnection

            if (this.env === Environments.DEBUG) {

            } else {
                shimmer.wrap(mysqlConnection.prototype, 'query', this.wrapQuery())
            }
        }

        const mysql = this.require("mysql");
        if (mysql) {
            this._mysql = mysql

            if (this.env === Environments.DEBUG) {

            } else {
            }
        }
    }

    private wrapQuery() {
        const integration = this
        return function (query) {
            return function (...args): Promise<QueryResult> {
                logger.info(`executing main wrapper`, integration.namespace)

                try {
                    const newArgs = [...args]
                    const {statement, originalCallback} = integration.parseArgs(...newArgs);

                    const wrappedCallback = (err: MysqlError | null, res?: any, fields?: FieldInfo[]) => {
                        if (!err) {
                            const correlationId = integration.hashSha1(statement);
                            logger.info(`CorrelationId: ${correlationId}`, integration.namespace)

                            const data: IQueryData = {
                                response: res,
                                fields
                            }

                            const trace = new Trace({
                                operationType: OperationsType.MYSQL_QUERY,
                                correlationId,
                                data
                            })

                            integration.tracer.add(trace.trace())
                        }

                        originalCallback(err, res, fields)
                    }

                    if (args.length === 3) {
                        newArgs[2] = wrappedCallback
                    } else {
                        newArgs[1] = wrappedCallback
                    }

                    return query.call(this, ...newArgs);
                } catch (error) {
                    logger.error(error, integration.namespace)
                    return query.apply(this, args);
                }
            };
        }
    }

    private parseArgs(...newArgs: any[]): IParsedArgs {
        const rawQueryOrOptions: string | QueryOptions = newArgs[0]
        let statement: string;
        let callback: queryCallback;
        let values: any[];
        const lastArgument = newArgs[2];

        /**
         * If there are three arguments:
         * (options: string | QueryOptions, values: any, callback?: queryCallback)
         */
        if (newArgs.length === 3) {
            values = newArgs[1]
            statement = this.replaceSqlQueryArgs(rawQueryOrOptions as string, values);
            callback = lastArgument;
        }

        /**
         * if there are two arguments:
         * (options: string | QueryOptions, callback?: queryCallback)
         */
        if (newArgs.length === 2) {
            if (typeof rawQueryOrOptions === 'string') {
                statement = rawQueryOrOptions
            } else {
                const {values, sql} = rawQueryOrOptions as QueryOptions
                statement = this.replaceSqlQueryArgs(sql, values)
            }

            callback = newArgs[1]
        }

        logger.info(`query: ${statement}`, this.namespace)

        return {
            statement,
            values,
            originalCallback: callback
        }
    }

    private wrapMockQuery() {
        const integration = this
        return function () {
            return function (...args): Promise<IQueryData> | any {
                throw new Error("Not implemented")
            }
        }
    }

    /**
     * This method mock the connect method.
     * In debug mode we do not connect to the database, therefore we need to mock that method.
     */
    private wrapMockConnect() {
        let integration = this
        return function (original) {
            return function (): any {
                throw new Error("Not implemented")
            }
        }
    }

    private handleResponse(value: QueryResult, statement: string): any {
        if (this.env === 'debug') {
        } else {
        }
    }

    /**
     * Replace all query parameters
     * Ex: SELECT 1 + ? AS result, [4] => SELECT 1 + 5 AS result
     */
    private replaceSqlQueryArgs(statement: string, values: any[]): string {
        return this._mysql.format(statement, values)
    }

    private getExtraFieldsFromRes(res: QueryResult, data: any) {
        if (this.config.extraFields) {
            this.config.extraFields.forEach(field => {
                data[field] = res[field]
            })
        }
    }

    /**
     * this will blacklist useless ORM extra statements
     */
    end() {
        if (this._mysqlConnection) {
            // @ts-ignore
            shimmer.unwrap(this._mysqlConnection.prototype, 'query')
        }
    }
}