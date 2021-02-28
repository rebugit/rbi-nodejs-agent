import {IIntegrationConfig} from "../config";
import {Tracer} from "../trace/Tracer";
import {TracesLoader} from "../trace/TracesLoader";
import {IIntegration} from "./index";

const shimmer = require("shimmer");
const {Integrations} = require("./integrations");

class PostgresIntegration extends Integrations implements IIntegration {
    private tracer: Tracer;
    private tracesLoader: TracesLoader;
    private env: string;
    private config: IIntegrationConfig;

    constructor() {
        super()

        this.env = process.env.REBUGIT_ENV
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
        return function (request) {
            return async function requestWrapper(options, callback) {
                try {
                    const req = await request.call(this, options);
                    // @ts-ignore
                    console.log(arguments)
                    if (callback) {
                        callback(null, req)
                        return
                    }

                    return req
                } catch (e) {
                    callback(e, null)
                }
            };
        }
    }

    end() {
        if (this._pg) {
            shimmer.unwrap(this._pg.Client.prototype, 'query')
        }
    }
}

module.exports = {
    PostgresIntegration
}
