import {Tracer} from "../trace/Tracer";
import {TracesLoader} from "../trace/TracesLoader";
import {IIntegrationConfig} from "../config";
import {MongodbIntegration} from "./mongodbIntegration";
import {MysqlIntegration} from "./mysqlIntegration";

const {PostgresIntegration} = require("./postgresIntegration");
const {HttpIntegration} = require("./httpIntegration");
const {EnvironmentIntegration} = require('./environmentIntegration')

export interface IIntegration {
    end(): void
    init(tracer: Tracer, tracesLoader: TracesLoader, config: IIntegrationConfig)
}

module.exports = {
    Http: HttpIntegration,
    Pg: PostgresIntegration,
    Env: EnvironmentIntegration,
    Mongo: MongodbIntegration,
    Mysql: MysqlIntegration,
}
