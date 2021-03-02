const {Http} = require('rbi-nodejs-agent/dist/integrations');
const {Tracer} = require('rbi-nodejs-agent/dist/trace/Tracer');
const {TracesLoader} = require('rbi-nodejs-agent/dist/trace/TracesLoader');
const {requestWithHttp, requestWithRequest, clearEnvironmentVariables} = require("./utils");
const axios = require('axios')
const superagent = require('superagent')
const expect = require('expect')

/**
 * Jest does not preserve symlink making those type of tests fails
 * By running normal nodejs function the tests can run correctly
 */
async function httpIntegrationProductionMode() {
    function beforeEach() {
        process.env.REBUGIT_DEBUG = 'ALL'
        const tracer = new Tracer()
        const tracesLoader = new TracesLoader()
        const httpIntegration = new Http()
        httpIntegration.init(tracer, tracesLoader, {})

        return {tracer}
    }

    function afterEach() {
        clearEnvironmentVariables()
    }

    async function httpIntegrationTestAxios() {
        const {tracer} = beforeEach();
        await axios.get('http://jsonplaceholder.typicode.com/todos/1')

        expect(tracer.traces.length).toBe(1)
        expect(tracer.traces[0].correlationId).toBe('GET_jsonplaceholder.typicode.com_/todos/1_1')
        expect(tracer.traces[0].operationType).toBe('RESPONSE')
        expect(tracer.traces[0].data).toBeDefined()

        afterEach()
    }

    async function httpIntegrationTestHttp(){
        const {tracer} = beforeEach();
        await requestWithHttp(false)

        expect(tracer.traces.length).toBe(1)
        expect(tracer.traces[0].correlationId).toBe('GET_jsonplaceholder.typicode.com_/todos/1_1')
        expect(tracer.traces[0].operationType).toBe('RESPONSE')
        expect(tracer.traces[0].data).toBeDefined()

        afterEach()
    }

    // TODO: callback is not a function (same for superagent)
    async function httpIntegrationTestRequest(){
        const {tracer} = beforeEach();
        await requestWithRequest()

        expect(tracer.traces.length).toBe(1)
        expect(tracer.traces[0].correlationId).toBe('GET_jsonplaceholder.typicode.com_/todos/1_1')
        expect(tracer.traces[0].operationType).toBe('RESPONSE')
        expect(tracer.traces[0].data).toBeDefined()

        afterEach()
    }

    await httpIntegrationTestAxios()
    await httpIntegrationTestHttp()
    await httpIntegrationTestRequest()
}

httpIntegrationProductionMode().then().catch(e => {
    console.log(e.message)
    process.exit(1)
})
