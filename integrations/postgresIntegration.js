class PostgresIntegration {
    constructor() {

    }

    wrap(config) {
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
}

/**
 * Example pg library wrapper, this works for Sequelize as well
 * @param config
 * @returns {function(*): function(*=, *=): Promise<undefined|*>}
 */
const pgWrapper = (config) => (request) => {
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

module.exports = {
    pgWrapper
}

// shimmer.wrap(pg.Client.prototype, 'query', pgWrapper({traceId: trace.traceId}))
