const {Pg} = require('rbi-nodejs-agent/dist/integrations');
const {Tracer} = require('rbi-nodejs-agent/dist/trace/Tracer');
const {TracesLoader} = require('rbi-nodejs-agent/dist/trace/TracesLoader');
const {
    clearEnvironmentVariables,
    pgQuery,
    sequelizeQuery,
    sha1,
    DB_QUERY
} = require("./utils");
const {traces} = require('./data')
const expect = require('expect')

async function productionMode() {
    let postgresIntegration;

    function beforeEach(name) {
        console.log(`============= TESTING: should ${name} ===================`)
        process.env.REBUGIT_LOG = 'ALL'
        const tracer = new Tracer()
        const tracesLoader = new TracesLoader()
        postgresIntegration = new Pg()
        postgresIntegration.init(tracer, tracesLoader, {})
        return {tracer}
    }

    function afterEach() {
        clearEnvironmentVariables()
        postgresIntegration.end()
        console.log(`\n\n`)
    }

    async function pg() {
        const {tracer} = beforeEach('capture pg response correctly');
        const value = 4
        const result = await pgQuery(value);
        const s = DB_QUERY.replace('$1', value);
        const hashedQuery = sha1(s);

        expect(tracer.traces.length).toBe(1)
        expect(tracer.traces[0].correlationId).toBe(hashedQuery)
        expect(result).toBe(21)

        afterEach()
    }

    await pg()
}

async function run(){
    await productionMode()
}

run().then().catch(e => {
    console.log(e.message)
    process.exit(1)
})
