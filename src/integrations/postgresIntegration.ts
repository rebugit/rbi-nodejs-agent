import {IIntegrationConfig} from "../config";
import {Tracer} from "../trace/Tracer";
import {TracesLoader} from "../trace/TracesLoader";
import {IIntegration} from "./index";
import {FieldDef, QueryResult} from "pg";
import {Trace} from "../trace/Trace";
import {PgMock} from "./mocks/pg";
import {Environments} from "../config/constants";

const shimmer = require("shimmer");
const logger = require('../logger')
const {Integrations} = require("./integrations");

interface IQueryData {
    rows: any[]
    command?: string;
    rowCount?: number;
    oid?: number;
    fields?: FieldDef[];
}

export class PostgresIntegration extends Integrations implements IIntegration {
    private tracer: Tracer;
    private tracesLoader: TracesLoader;
    private readonly env: string;
    private config: IIntegrationConfig;
    private namespace: string;
    private _pg: any;
    private _pgPool: any;

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

        const pg = this.require("pg");
        if (pg) {
            this._pg = pg

            /**
             * In debug mode, rather then mock only the query method, we need to mock extra methods,
             * one of those is connect since we need to avoid connecting to the physical database
             */
            if (this.env === Environments.DEBUG) {
                shimmer.wrap(pg.Client.prototype, 'connect', this.wrapMockConnect())
                shimmer.wrap(pg.Client.prototype, 'query', this.wrapForDebug())
            } else {
                shimmer.wrap(pg.Client.prototype, 'query', this.wrap())
            }
        }

        const pgPool = this.require('pg-pool')
        if (pgPool) {
            this._pgPool = pgPool

            if (this.env === Environments.DEBUG) {
                shimmer.wrap(pgPool.prototype, 'query', this.wrapForDebug())
                shimmer.wrap(pgPool.prototype, 'connect', this.wrapDebugPool())
            }
        }
    }

    private wrap() {
        const integration = this
        return function (query) {
            return function (...args): Promise<QueryResult> {
                logger.info(`executing main wrapper`, integration.namespace)

                try {
                    const newArgs = [...args];
                    const statement = integration.getStatement(newArgs);
                    logger.info(`statement ${statement}`, integration.namespace)

                    const {callbackIndex, originalCallback} = integration.getCallback(newArgs);

                    if (callbackIndex >= 0) {
                        // Inject callback
                        newArgs[callbackIndex] = (err: any, value: QueryResult) => {
                            const queryResult = integration.handleResponse(value, statement);
                            originalCallback(err, queryResult)
                        };
                    }

                    const result = query.apply(this, newArgs);

                    if (result && typeof result.then === 'function') {
                        result.then(function (value: QueryResult) {
                            return integration.handleResponse(value, statement)
                        }).catch(function (error: any) {
                            logger.error(error, integration.namespace)
                            return error;
                        });
                    }

                    return result;
                } catch (error) {
                    logger.error(error, integration.namespace)
                    return query.apply(this, args);
                }
            };
        }
    }

    private wrapForDebug() {
        const integration = this
        return function () {
            return function (...args): Promise<IQueryData> | any {
                logger.info(`executing wrap for debug`, integration.namespace)
                const newArgs = [...args]
                const statement = integration.getStatement(args);
                logger.info(`statement ${statement}`, integration.namespace)

                const {callback} = integration.getCallback(newArgs)
                if (callback) {
                    return callback(null, integration.handleResponse(null, statement))
                }

                return Promise.resolve(integration.handleResponse(null, statement))
            }
        }
    }

    private wrapDebugPool() {
        const integration = this
        return function () {
            return function (): any {
                logger.info(`executing pool debug wrapper`, integration.namespace)

                const poolMock = new PgMock().mockPool()
                // @ts-ignore
                poolMock.query = (...args) => {
                    const newArgs = [...args];
                    const statement = integration.getStatement(newArgs);
                    const data = integration.handleResponse(null, statement)
                    logger.info(`statement ${statement}`, integration.namespace)
                    logger.info(`trace data ${data}`, integration.namespace)

                    const {callback} = integration.getCallback(newArgs);

                    if (callback) {
                        callback(data)
                    } else {
                        return Promise.resolve(data)
                    }
                }

                return poolMock
            }
        }
    }

    /**
     * This methods mock extra pg client methods.
     * In debug method we do not need to connect to the database, therefore we need to mock that method.
     * There might be more methods in the future so we keep the function open to extension
     */
    private wrapMockConnect() {
        let integration = this
        return function (original) {
            return function (): any {
                logger.info(`mocking: connect method`, integration.namespace)
                if (arguments.length) {
                    const __this = {
                        _connect: (callback?: (...args: any[]) => void): any => {
                            callback(null, {
                                on: () => {
                                },
                                query: (...args) => {
                                    return integration.wrapForDebug()()(...args)
                                }
                            })
                        }
                    }

                    return original.apply(__this, arguments)
                }

                return new PgMock().mockPg({}).connect
            }
        }
    }

    private handleResponse(value: QueryResult, statement: string): IQueryData {
        if (this.env === 'debug') {
            const correlationId = this.hashSha1(statement);
            logger.info(`correlation id: ${correlationId}`, this.namespace)

            const data = this.tracesLoader.get<IQueryData>(correlationId)
            if (data) {
                return data
            }

            return {
                rows: [{version: "PostgreSQL 10.11 "}],
                fields: [],
                command: "SELECT",
                rowCount: 0
            }
        } else {
            if (this.isInvalidStatement(statement)) {
                return value
            }

            const correlationId = this.hashSha1(statement);

            const data: IQueryData = {
                rows: value.rows
            }

            this.getExtraFieldsFromRes(value, data)

            const trace = new Trace({
                operationType: 'QUERY',
                correlationId,
                data
            })

            this.tracer.add(trace.trace())

            return value;
        }
    }

    private getCallback(newArgs: any[]): {
        callback: (...args: any[]) => void,
        callbackIndex: number,
        originalCallback: any
    } {
        let originalCallback: any;
        let callbackIndex = -1;

        for (let i = 1; i < newArgs.length; i++) {
            if (typeof newArgs[i] === 'function') {
                originalCallback = newArgs[i];
                callbackIndex = i;
                break;
            }
        }

        return {
            callback: newArgs[callbackIndex],
            callbackIndex: callbackIndex,
            originalCallback
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

    /**
     * this will blacklist useless ORM extra statements
     */
    private isInvalidStatement(statement: string): boolean {
        const index = blackListStatements
            .findIndex(element => statement.toUpperCase().includes(element.toUpperCase()))
        return index >= 0;
    }

    end() {
        if (this._pg) {
            shimmer.unwrap(this._pg.Client.prototype, 'query')
            shimmer.unwrap(this._pg.Client.prototype, 'connect')
        }

        if (this._pgPool) {
            shimmer.unwrap(this._pgPool.prototype, 'query')
            shimmer.unwrap(this._pgPool.prototype, 'connect')
        }
    }
}

/**
 * Group of queries that we don't want to store, mostly ORM internal queries
 */
const blackListStatements: string[] = [
    'SET CLIENT_MIN_MESSAGES TO WARNING',
    'SELECT VERSION();',
    'WITH ranges AS (  SELECT pg_range.rngtypid, pg_type.typname AS rngtypname,         pg_type.typarray AS rngtyparray, pg_range.rngsubtype    FROM pg_range LEFT OUTER JOIN pg_type ON pg_type.oid = pg_range.rngtypid)SELECT pg_type.typname, pg_type.typtype, pg_type.oid, pg_type.typarray,       ranges.rngtypname, ranges.rngtypid, ranges.rngtyparray  FROM pg_type LEFT OUTER JOIN ranges ON pg_type.oid = ranges.rngsubtype WHERE (pg_type.typtype IN(\'b\', \'e\'));'
]
