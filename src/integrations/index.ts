import {Tracer} from "../trace/Tracer";
import {TracesLoader} from "../trace/TracesLoader";
import {IIntegrationConfig} from "../config";

const {PostgresIntegration} = require("./postgresIntegration");
const {HttpIntegration} = require("./httpIntegration");

export interface IIntegration {
    end(): void
    init(tracer: Tracer, tracesLoader: TracesLoader, config: IIntegrationConfig)
}

module.exports = {
    Http: HttpIntegration,
    Pg: PostgresIntegration,
}
