import {IIntegrationConfig} from "../config";
import {Tracer} from "../trace/Tracer";
import {TracesLoader} from "../trace/TracesLoader";
import {IIntegration} from "./index";
import {Environments} from "../sharedKernel/constants";
import path from "path";
import {Connection} from "mysql";
import {MysqlIntegration} from "./mysqlIntegration";

const shimmer = require("shimmer");

export class Mysql2Integration extends MysqlIntegration implements IIntegration {
    protected tracer: Tracer;
    protected tracesLoader: TracesLoader;
    protected readonly env: string;
    protected config: IIntegrationConfig;
    protected readonly namespace: string;
    protected _mysqlConnection2: Connection;
    protected _mysql2: any;

    constructor() {
        super()

        this.env = process.env.REBUGIT_ENV
        this.namespace = 'mysql2Integration'

        this.mockQuery = this.mockQuery.bind(this);
    }

    init(tracer: Tracer, tracesLoader: TracesLoader, config: IIntegrationConfig) {
        this.tracer = tracer
        this.tracesLoader = tracesLoader
        this.config = config || {}

        const mysqlConnection2 = this.require(path.join("mysql2", "lib/connection"));
        if (mysqlConnection2) {
            this._mysqlConnection2 = mysqlConnection2

            if (this.env === Environments.DEBUG) {
            } else {
                shimmer.wrap(mysqlConnection2.prototype, 'query', this.wrapQuery())
            }
        }

        const mysql2 = this.require("mysql2");
        if (mysql2) {
            this._mysql2 = mysql2

            if (this.env === Environments.DEBUG) {
                shimmer.wrap(mysql2, 'createConnection', this.wrapMockCreateConnection())
                shimmer.wrap(mysql2, 'createPool', this.wrapMockCreatePool())
            } else {
            }
        }
    }

    protected replaceSqlQueryArgs(statement: string, values: any[]): string {
        return this._mysql2.format(statement, values)
    }

    end() {
        if (this.env === Environments.DEBUG) {
            if (this._mysql2) {
                shimmer.unwrap(this._mysql2, 'createConnection')
                shimmer.unwrap(this._mysql2, 'createPool')
            }
        } else {
            if (this._mysqlConnection2) {
                // @ts-ignore
                shimmer.unwrap(this._mysqlConnection2.prototype, 'query')
            }
        }
    }
}