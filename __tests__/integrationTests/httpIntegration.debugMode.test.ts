import {Tracer} from "../../src/trace/Tracer";
import {HttpIntegration} from "../../src/integrations/httpIntegration";
import {TracesLoader} from "../../src/trace/TracesLoader";
// @ts-ignore
import {Http} from "../../src/integrations"
import {HTTP_RESPONSE_BODY, traces as httpTraces} from "./utils/http.data"
import {traces as awsTraces, dynamodbGetItemResponseBodyDebugMode} from "./utils/http.aws-sdk.data"
import {clearEnvironmentVariables} from "../utils";
import {
    requestWithAxios,
    requestWithGot,
    requestWithHttp,
    requestWithHttpStreams,
    requestWithSuperagent
} from "./utils/http.utils";
import axios from "axios";
import each from 'jest-each'
import {getRequestWithDynamodb, putRequestWithDynamodb} from "./utils/http.aws-sdk.utils";

describe('HttpIntegration debug mode', function () {
    describe('Normal http request', function () {
        let tracer: Tracer
        let httpIntegration: HttpIntegration

        beforeEach(function () {
            process.env.REBUGIT_ENV = 'debug'
            tracer = new Tracer()
            const tracesLoader = new TracesLoader()
            tracesLoader.load(httpTraces)
            httpIntegration = new Http()
            httpIntegration.init(tracer, tracesLoader, {})
        });

        afterEach(function () {
            clearEnvironmentVariables()
            httpIntegration.end()
        });

        each([
            ['http', requestWithHttp],
            ['httpStreams', requestWithHttpStreams],
            ['got', requestWithGot],
            ['superagent', requestWithSuperagent],
        ])
            .it('should integrate with http native module', async function (clientName, client) {
                const response = await client();

                expect(response).toEqual(HTTP_RESPONSE_BODY)
            });

        it('should integrate with axios', async function () {
            axios.interceptors.request.use((config) => {
                expect(config.url).toBe(`http://localhost:8080/todo/1`)
                return config;
            });

            const response = await requestWithAxios();

            expect(response).toEqual(HTTP_RESPONSE_BODY)
        });
    });

    describe('AWS-SDK', function () {
        let tracer: Tracer
        let httpIntegration: HttpIntegration

        beforeEach(function () {
            process.env.REBUGIT_LOG = 'ALL'
            process.env.REBUGIT_ENV = 'debug'
            tracer = new Tracer()
            const tracesLoader = new TracesLoader()
            tracesLoader.load(awsTraces)
            httpIntegration = new Http()
            httpIntegration.init(tracer, tracesLoader, {})
        });

        afterEach(function () {
            clearEnvironmentVariables()
            httpIntegration.end()
        });

        it('should correctly inject data and mock aws sdk request for two times', async function () {
            await putRequestWithDynamodb();

            const response = await getRequestWithDynamodb();

            expect(response).toEqual(dynamodbGetItemResponseBodyDebugMode)
        });
    });
});
