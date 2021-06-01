import {Tracer} from "../../src/trace/Tracer";
import {TracesLoader} from "../../src/trace/TracesLoader";
import {clearEnvironmentVariables} from "../utils";
import {
    postRequestWithGot,
    requestWithAxios,
    requestWithGot,
    requestWithHttp, requestWithHttpStreams,
    requestWithSuperagent,
} from "./utils/http.utils";
import each from 'jest-each';
import {parse} from "flatted";
import {
    dropDynamodbTable,
    getRequestWithDynamodb,
    putRequestWithDynamodb,
    seedDynamodbTable
} from "./utils/http.aws-sdk.utils";
import {dynamodbGetItemResponseBody} from "./utils/http.aws-sdk.data";
import {HttpIntegrationV2} from "../../src/integrations/httpIntegrationV2";

describe('HttpIntegrationV2 prod mode', function () {
    describe('Normal http requests', function () {
        let httpIntegration: HttpIntegrationV2
        let tracer: Tracer

        beforeEach(async function () {
            tracer = new Tracer()
            const tracesLoader = new TracesLoader()
            httpIntegration = new HttpIntegrationV2()
            await httpIntegration.init(tracer, tracesLoader, {})
        });

        afterEach(function () {
            clearEnvironmentVariables()
            httpIntegration.end()
        });

        each([
            ['http', requestWithHttp],
            ['httpStreams', requestWithHttpStreams],
            ['axios', requestWithAxios],
            ['superagent', requestWithSuperagent],
            ['got', requestWithGot],
        ])
            .it('should integrate %s module', async (clientName, client, done) => {
                const response = await client();

                expect(tracer.traces.length).toBe(1)
                expect(tracer.traces[0].correlationId).toBe('GET_localhost/todo/1')
                expect(tracer.traces[0].operationType).toBe('RESPONSE')
                expect(response).toEqual(JSON.parse(parse(tracer.traces[0].data).body))
                done()
            })

        it('should integrate with got post request', async function () {
            const response = await postRequestWithGot();

            expect(tracer.traces.length).toBe(1)
            expect(tracer.traces[0].correlationId).toBe('POST_localhost/todo/1_2248ee2fa0aaaad99178531f924bf00b4b0a8f4e')
            expect(tracer.traces[0].operationType).toBe('RESPONSE')
            expect(response).toEqual(JSON.parse(parse(tracer.traces[0].data).body))
        });
    });

    describe('AWS-SDK', function () {
        let httpIntegration: HttpIntegrationV2
        let tracer: Tracer

        beforeEach(async function () {
            await seedDynamodbTable()
            tracer = new Tracer()
            const tracesLoader = new TracesLoader()
            httpIntegration = new HttpIntegrationV2()
            await httpIntegration.init(tracer, tracesLoader, {})
        });

        afterEach(async function () {
            await dropDynamodbTable()
            clearEnvironmentVariables()
            httpIntegration.end()
        });

        it('should integrate with dynamodb getItem', async function () {
            const response = await getRequestWithDynamodb();

            expect(tracer.traces.length).toBe(1)
            expect(tracer.traces[0].correlationId).toBe('POST_localhost/_DynamoDB_20120810.GetItem_dab0a6a66b0c6978efb0a7ada75f1b53e5901ba6dd9570f9419f582e06ab72dc')
            expect(tracer.traces[0].operationType).toBe('DYNAMODB')
            expect(response).toEqual(dynamodbGetItemResponseBody)
        });

        it('should integrate with dynamodb putItem', async function () {
            await putRequestWithDynamodb();

            expect(tracer.traces.length).toBe(1)
            expect(tracer.traces[0].correlationId).toBe('POST_localhost/_DynamoDB_20120810.PutItem_26ef5afdfad34d68a392daea5947a0753bbb68e1453f4f6858b621cab624f931')
            expect(tracer.traces[0].operationType).toBe('DYNAMODB')
        });
    });
});