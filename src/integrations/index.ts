import {Tracer} from "../trace/Tracer";
import {TracesLoader} from "../trace/TracesLoader";
import {IIntegrationConfig} from "../config";
import {MongodbIntegration} from "./mongodbIntegration";
import {MysqlIntegration} from "./mysqlIntegration";
import {Mysql2Integration} from "./mysql2Integration";
import {HttpIntegrationV2} from "./httpIntegrationV2";

const {PostgresIntegration} = require("./postgresIntegration");
const {EnvironmentIntegration} = require('./environmentIntegration')

export interface IIntegration {
    end(): void
    init(tracer: Tracer, tracesLoader: TracesLoader, config: IIntegrationConfig)
}

module.exports = {
    HttpV2: HttpIntegrationV2,
    Pg: PostgresIntegration,
    Env: EnvironmentIntegration,
    Mongo: MongodbIntegration,
    Mysql: MysqlIntegration,
    Mysql2: Mysql2Integration
}
