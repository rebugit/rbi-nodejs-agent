import {HttpIntegration} from "../../src/integrations/httpIntegration";
import {Tracer} from "../../src/trace/Tracer";
import {TracesLoader} from "../../src/trace/TracesLoader";
import {requestWithHttp, requestWithRequest, clearEnvironmentVariables} from "./utils";

describe('HttpIntegration', function () {
    describe('Production mode', function () {
        let tracer, tracesLoader, httpIntegration

        beforeEach(function () {
            process.env.REBUGIT_DEBUG='ALL'
            tracer = new Tracer()
            tracesLoader = new TracesLoader()
            httpIntegration = new HttpIntegration()
        });

        afterEach(function () {
            clearEnvironmentVariables()
        });

        it.skip('should integrate with http request', async function () {
            httpIntegration.init(tracer, tracesLoader, {})

            await requestWithHttp()

            expect(tracer.traces.length).toBe(1)
            expect(tracer.traces[0].correlationId).toBe('GET_jsonplaceholder.typicode.com_/todos/1_1')
            expect(tracer.traces[0].operationType).toBe('RESPONSE')
        });

        it.skip('should integrate with request get request', async function () {
            httpIntegration.init(tracer, tracesLoader, {})

            await requestWithRequest()

            expect(tracer.traces.length).toBe(1)
            expect(tracer.traces[0].correlationId).toBe('GET_jsonplaceholder.typicode.com_/todos/1_1')
            expect(tracer.traces[0].operationType).toBe('RESPONSE')
        })
    });
});
