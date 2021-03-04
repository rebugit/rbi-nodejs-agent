const {Pg} = require('rbi-nodejs-agent/dist/integrations');
const {Tracer} = require('rbi-nodejs-agent/dist/trace/Tracer');
const {TracesLoader} = require('rbi-nodejs-agent/dist/trace/TracesLoader');
const {
    clearEnvironmentVariables,
    pgQuery,
    sequelizeQuery,
    pgPoolQuery,
    knexQuery,
    sha1,
    DB_QUERY
} = require("./utils");
const {traces} = require('./data')
const expect = require('expect')

const hashQuery = () => {
    const s = DB_QUERY.replace('$1', 4);
    return {
        hashedQuery: sha1(s),
        value: 4
    }
}

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
        const {hashedQuery, value} = hashQuery()
        const result = await pgQuery(value);

        expect(tracer.traces.length).toBe(1)
        expect(tracer.traces[0].correlationId).toBe(hashedQuery)
        expect(result).toBe(21)

        afterEach()
    }

    async function pgPool(){
        const {tracer} = beforeEach('capture pg Pool response correctly');
        const {hashedQuery, value} = hashQuery()
        const result = await pgPoolQuery(value);

        expect(tracer.traces.length).toBe(1)
        expect(tracer.traces[0].correlationId).toBe(hashedQuery)
        expect(result).toBe(21)

        afterEach()
    }

    async function sequelize() {
        const {tracer} = beforeEach('capture sequelize response correctly');
        const {hashedQuery, value} = hashQuery()
        const result = await sequelizeQuery(value);

        expect(tracer.traces.length).toBe(1)
        expect(tracer.traces[0].correlationId).toBe(hashedQuery)
        expect(result).toBe(21)

        afterEach()
    }

    async function knex() {
        const {tracer} = beforeEach('capture knex response correctly');
        const {hashedQuery, value} = hashQuery()
        const result = await knexQuery(value);

        expect(tracer.traces.length).toBe(1)
        expect(tracer.traces[0].correlationId).toBe(hashedQuery)
        expect(result).toBe(21)

        afterEach()
    }

    await pg()
    await pgPool()
    await sequelize()
    await knex()
}

async function debugMode() {
    let postgresIntegration;

    function beforeEach(name) {
        console.log(`============= TESTING: should ${name} ===================`)
        process.env.REBUGIT_LOG = 'ALL'
        process.env.REBUGIT_ENV = 'debug'
        const tracer = new Tracer()
        const tracesLoader = new TracesLoader()
        tracesLoader.load(traces)
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
        beforeEach('mock pg library and inject query data')

        const data = await pgQuery(4);

        expect(data).toBe(21)

        afterEach()
    }

    async function pgPool() {
        beforeEach('mock pg Pool library and inject query data')

        const data = await pgPoolQuery(4);

        expect(data).toBe(21)

        afterEach()
    }

    async function sequelize() {
        beforeEach('mock sequelize library and inject query data')

        const data = await sequelizeQuery(4);

        expect(data).toBe(21)

        afterEach()
    }

    async function knex() {
        beforeEach('mock knex library and inject query data');

        const result = await knexQuery(4);

        expect(result).toBe(21)

        afterEach()
    }


    await pg()
    await pgPool()
    await sequelize()
    await knex()
}

async function run() {
    await productionMode()
    await debugMode()
    console.log("======DONE======")
}

run().then().catch(e => {
    console.log("There was an error! Test Failed!")
    console.log(e.message)
    console.log(e.stack)
    process.exit(1)
})
