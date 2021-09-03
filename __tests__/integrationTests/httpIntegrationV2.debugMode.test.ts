import {Tracer} from "../../src/trace/Tracer";
import {TracesLoader} from "../../src/trace/TracesLoader";
import {HTTP_RESPONSE_BODY, traces as httpTraces} from "./utils/http.data"
import {dynamodbGetItemResponseBodyDebugMode, traces as awsTraces} from "./utils/http.aws-sdk.data"
import {clearEnvironmentVariables} from "../utils";
import {
    postRequestWithGot,
    requestWithAxios,
    requestWithGot,
    requestWithHttp,
    requestWithHttpStreams,
    requestWithSuperagent
} from "./utils/http.utils";
import axios from "axios";
import each from 'jest-each'
import {getRequestWithDynamodb, putRequestWithDynamodb} from "./utils/http.aws-sdk.utils";
import {HttpIntegrationV2} from "../../src/integrations/httpIntegrationV2";

describe('HttpIntegrationV2 debug mode', function () {
    describe('Normal http request', function () {
        let tracer: Tracer
        let httpIntegrationV2: HttpIntegrationV2

        beforeEach(async function () {
            process.env.REBUGIT_ENV = 'debug'
            tracer = new Tracer()
            const tracesLoader = new TracesLoader()
            tracesLoader.load(httpTraces)
            httpIntegrationV2 = new HttpIntegrationV2()
            await httpIntegrationV2.init(tracer, tracesLoader, {})
        });

        afterEach(function () {
            clearEnvironmentVariables()
            httpIntegrationV2.end()
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

        it('should integrate with got post request', async function () {
            const response = await postRequestWithGot();

            expect(response).toEqual(HTTP_RESPONSE_BODY)
        });
    });

    describe('AWS-SDK', function () {
        let tracer: Tracer
        let httpIntegrationV2: HttpIntegrationV2

        beforeEach(async function () {
            process.env.REBUGIT_ENV = 'debug'
            process.env.AWS_ACCESS_KEY_ID = 'fake_access_key'
            process.env.AWS_SECRET_ACCESS_KEY = 'fake_secret_access_key'
            tracer = new Tracer()
            const tracesLoader = new TracesLoader()
            tracesLoader.load(awsTraces)
            httpIntegrationV2 = new HttpIntegrationV2()
            await httpIntegrationV2.init(tracer, tracesLoader, {})
        });

        afterEach(function () {
            clearEnvironmentVariables()
            httpIntegrationV2.end()
        });

        it('should correctly inject data and mock aws sdk request for two times and executed with promise.all', async function () {
            const [_, response] = await Promise.all([
                putRequestWithDynamodb(),
                getRequestWithDynamodb()
            ])

            expect(response).toEqual(dynamodbGetItemResponseBodyDebugMode)
        });
    });
});
