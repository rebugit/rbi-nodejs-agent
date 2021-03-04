const {Http} = require('rbi-nodejs-agent/dist/integrations');
const {Tracer} = require('rbi-nodejs-agent/dist/trace/Tracer');
const {TracesLoader} = require('rbi-nodejs-agent/dist/trace/TracesLoader');
const {
    requestWithHttp,
    requestWithRequest,
    requestWithAxios,
    clearEnvironmentVariables,
    RESPONSE_BODY
} = require("./utils");
const {traces} = require('./data')
const expect = require('expect')

/**
 * Jest does not preserve symlink making those type of tests fails
 * By running normal nodejs function the tests can run correctly
 */
async function httpIntegrationProductionMode() {
    let httpIntegration;

    function beforeEach(name) {
        console.log(`============= TESTING: should ${name} ===================`)
        process.env.REBUGIT_LOG = 'ALL'
        const tracer = new Tracer()
        const tracesLoader = new TracesLoader()
        httpIntegration = new Http()
        httpIntegration.init(tracer, tracesLoader, {})
        return {tracer}
    }

    function afterEach() {
        clearEnvironmentVariables()
        httpIntegration.end()
        console.log(`\n\n`)
    }

    async function httpIntegrationTestAxios() {
        const {tracer} = beforeEach('correctly integrate with axios');

        const axiosResponse = await requestWithAxios();

        expect(tracer.traces.length).toBe(1)
        expect(tracer.traces[0].correlationId).toBe('GET_/todos/1_1')
        expect(tracer.traces[0].operationType).toBe('RESPONSE')
        expect(tracer.traces[0].data).toBeDefined()
        expect(axiosResponse.data).toEqual(RESPONSE_BODY)

        afterEach()
    }

    async function httpIntegrationTestAxiosHttps() {
        const {tracer} = beforeEach('correctly integrate with axios via https');

        const axiosResponse = await requestWithAxios(true);

        expect(tracer.traces.length).toBe(1)
        expect(tracer.traces[0].correlationId).toBe('GET_/todos/1_1')
        expect(tracer.traces[0].operationType).toBe('RESPONSE')
        expect(tracer.traces[0].data).toBeDefined()
        expect(axiosResponse.data).toEqual(RESPONSE_BODY)

        afterEach()
    }

    async function httpIntegrationTestHttp() {
        const {tracer} = beforeEach('correctly integrate with native http module');
        const response = await requestWithHttp(false);

        expect(tracer.traces.length).toBe(1)
        expect(tracer.traces[0].correlationId).toBe('GET_/todos/1_1')
        expect(tracer.traces[0].operationType).toBe('RESPONSE')
        expect(tracer.traces[0].data).toBeDefined()
        expect(response).toEqual(RESPONSE_BODY)

        afterEach()
    }

    async function httpIntegrationTestRequest() {
        const {tracer} = beforeEach('correctly integrate with request module');
        const response = await requestWithRequest();

        expect(tracer.traces.length).toBe(1)
        expect(tracer.traces[0].correlationId).toBe('GET_/todos/1_1')
        expect(tracer.traces[0].operationType).toBe('RESPONSE')
        expect(tracer.traces[0].data).toBeDefined()
        expect(JSON.parse(response)).toEqual(RESPONSE_BODY)

        afterEach()
    }

    async function httpIntegrationTestMultipleRequestWithSamePath() {
        const {tracer} = beforeEach('correctly integrate with native http module and make parallel request');
        await Promise.all([
            await requestWithHttp(false),
            await requestWithHttp(false),
            await requestWithHttp(false)
        ])

        expect(tracer.traces.length).toBe(3)
        expect(tracer.traces[0].correlationId).toBe('GET_/todos/1_1')
        expect(tracer.traces[1].correlationId).toBe('GET_/todos/1_2')
        expect(tracer.traces[2].correlationId).toBe('GET_/todos/1_3')


        afterEach()
    }

    await httpIntegrationTestAxios()
    await httpIntegrationTestHttp()
    await httpIntegrationTestRequest()
    await httpIntegrationTestAxiosHttps()
    await httpIntegrationTestMultipleRequestWithSamePath()
}

async function httpIntegrationDebugMode() {
    let httpIntegration;

    function beforeEach(name) {
        console.log(`============= TESTING: should ${name} ===================`)
        process.env.REBUGIT_LOG = 'ALL'
        process.env.REBUGIT_ENV = 'debug'
        const tracer = new Tracer()
        const tracesLoader = new TracesLoader()
        tracesLoader.load(traces)
        httpIntegration = new Http()
        httpIntegration.init(tracer, tracesLoader, {})
        return {tracer}
    }

    function afterEach() {
        clearEnvironmentVariables()
        httpIntegration.end()
        console.log(`\n\n`)
    }

    async function httpIntegrationTestAxios() {
        beforeEach('correctly inject data and mock axios');

        const axiosResponse = await requestWithAxios();
        expect(axiosResponse.data).toEqual(RESPONSE_BODY)

        afterEach()
    }

    async function httpIntegrationTestWithRequest() {
        beforeEach('correctly inject data and mock request module');

        const axiosResponse = await requestWithRequest();
        expect(axiosResponse).toEqual(RESPONSE_BODY)

        afterEach()
    }

    async function httpIntegrationTestWithHttp() {
        beforeEach('correctly inject data and mock http native module');

        const axiosResponse = await requestWithHttp();
        expect(axiosResponse).toEqual(RESPONSE_BODY)

        afterEach()
    }

    await httpIntegrationTestAxios()
    await httpIntegrationTestWithHttp()
    await httpIntegrationTestWithRequest()
}

async function runTests() {
    await httpIntegrationProductionMode()
    await httpIntegrationDebugMode()
}

runTests().then().catch(e => {
    console.log(e.message)
    process.exit(1)
})
