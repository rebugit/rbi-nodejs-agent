import {IIntegrationConfig} from "../config";
import {Tracer} from "../trace/Tracer";
import {TracesLoader} from "../trace/TracesLoader";
import {IIntegration} from "./index";
import {FieldDef, QueryResult} from "pg";
import {Environments} from "../sharedKernel/constants";
import path from "path";

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

export class MysqlIntegration extends Integrations implements IIntegration {
    private tracer: Tracer;
    private tracesLoader: TracesLoader;
    private readonly env: string;
    private config: IIntegrationConfig;
    private readonly namespace: string;
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

        const mysql = this.require(path.join("mysql", "lib/Connection"));

        if (mysql) {
            this._mysql = mysql

            /**
             * In debug mode we need to mock extra methods,
             * one of those is connect since we need to avoid connecting to the physical database
             */
            if (this.env === Environments.DEBUG) {

            } else {
                shimmer.wrap(mysql.prototype, 'query', this.wrapQuery())
            }
        }
    }

    private wrapQuery() {
        const integration = this
        return function (query) {
            return function (...args): Promise<QueryResult> {
                logger.info(`executing main wrapper`, integration.namespace)
                // console.log(args)

                try {
                    const statement = args[0];
                    const values = args[1];

                    if (statement) {
                        const statementType = statement.split(' ')[0].toUpperCase();
                        // console.log(statementType)
                    }
                    if (statement && Array.isArray(values)) {
                        const fullStatement = integration.replaceSqlQueryArgs(statement, values);
                        const correlationId = integration.hashSha1(fullStatement);
                        console.log(fullStatement)
                        console.log(correlationId)
                    }

                    const sequence = query.call(this, ...args);

                    const originalCallback = sequence.onResult;

                    const wrappedCallback = (err: any, res: any) => {
                        if (err) {
                        }

                        originalCallback(err, res)
                    };

                    if (sequence.onResult) {
                        sequence.onResult = wrappedCallback;
                    } else {
                        sequence.on('end', () => {
                            console.log("end")
                        });
                    }

                    return sequence;
                } catch (error) {
                    return query.apply(this, args);
                }
            };
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
        let finalStatement = statement
        const replacerCount = statement.split("?").length - 1;

        for (let i = 0; i < replacerCount; i++) {
            finalStatement = finalStatement.replace("?", values[i])
        }

        return finalStatement
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
        if (this._mysql) {
            shimmer.unwrap(this._mysql.prototype, 'query')
        }
    }
}