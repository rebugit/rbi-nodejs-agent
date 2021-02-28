const shimmer = require("shimmer");
const {Integrations} = require("./integrations");

class PostgresIntegration extends Integrations {
    constructor(tracer, tracesLoader, config) {
        super()
        this.tracer = tracer
        this.tracesLoader = tracesLoader
        this.REBUGIT_ENV = process.env.REBUGIT_ENV
        this.config = config

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
    wrap() {
        return function (request) {
            return async function requestWrapper(options, callback) {
                try {
                    const req = await request.call(this, options);
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
        if (this._pg){
            shimmer.unwrap(this._pg.Client.prototype, 'query')
        }
    }
}

module.exports = {
    PostgresIntegration
}
