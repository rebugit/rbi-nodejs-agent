const {Mysql} = require('rbi-nodejs-agent/dist/integrations');
const {Tracer} = require('rbi-nodejs-agent/dist/trace/Tracer');
const {TracesLoader} = require('rbi-nodejs-agent/dist/trace/TracesLoader');
const {
    mysqlQuery,
    clearEnvironmentVariables
} = require("./utils");
const {traces} = require('./data')
const expect = require('expect')

/**
 * Jest does not preserve symlink making those type of tests fails
 * By running normal nodejs function the tests can run correctly
 */
async function httpIntegrationProductionMode() {
    let mysqlIntegration;

    function beforeEach(name) {
        console.log(`============= TESTING: should ${name} ===================`)
        process.env.REBUGIT_LOG = 'ALL'
        const tracer = new Tracer()
        const tracesLoader = new TracesLoader()
        mysqlIntegration = new Mysql()
        mysqlIntegration.init(tracer, tracesLoader, {})
        return {tracer}
    }

    function afterEach() {
        clearEnvironmentVariables()
        mysqlIntegration.end()
        console.log(`\n\n`)
    }

    async function httpIntegrationTestAxios() {
        const {tracer} = beforeEach('correctly integrate with native mysql driver');

        const response = await mysqlQuery('SELECT (1 + ?) * ? AS result', [4, 2]);
        console.log(response)

        afterEach()
    }

    await httpIntegrationTestAxios()
}

async function httpIntegrationDebugMode() {
    let mysqlIntegration;

    function beforeEach(name) {
        console.log(`============= TESTING: should ${name} ===================`)
        process.env.REBUGIT_LOG = 'ALL'
        process.env.REBUGIT_ENV = 'debug'
        const tracer = new Tracer()
        const tracesLoader = new TracesLoader()
        tracesLoader.load(traces)
        mysqlIntegration = new Mysql()
        mysqlIntegration.init(tracer, tracesLoader, {})
        return {tracer}
    }

    function afterEach() {
        clearEnvironmentVariables()
        mysqlIntegration.end()
        console.log(`\n\n`)
    }
}

async function runTests() {
    await httpIntegrationProductionMode()
    await httpIntegrationDebugMode()
    console.log("======DONE======\n\n")
}

runTests().then().catch(e => {
    console.log(e.message)
    process.exit(1)
})
