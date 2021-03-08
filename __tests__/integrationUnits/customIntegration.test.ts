import {CustomIntegration} from "../../src/integrations/customIntegration";
import {TracesLoader} from "../../src/trace/TracesLoader";
import {ITrace} from "../../src/trace/Trace";
import {stringify} from "flatted";
import {Tracer} from "../../src/trace/Tracer";

const mockModule = {
    methodToShim: (num) => {
        return 1 + num
    }
}

describe('customIntegration', function () {
    it('should init custom integration and shim the module', function () {
        expect(mockModule.methodToShim(3)).toBe(4)

        function customIntegrationCallback(env, close, getData, wrap) {
            expect(env).toBe('dev')
            expect(typeof close).toBe('function')
            expect(typeof getData).toBe('function')
            expect(typeof wrap).toBe('function')

            wrap(mockModule, 'methodToShim', (original) => {
                return function () {
                    return 'mocked';
                };
            })

            return {
                module: mockModule,
                name: 'myCustomIntegration'
            }
        }

        const customIntegration = new CustomIntegration(customIntegrationCallback)
        customIntegration.init(undefined, undefined, undefined)

        expect(mockModule.methodToShim(3)).toBe('mocked')
    });

    it('should init custom integration and get data', function () {
        const traces: ITrace[] = [
            {correlationId: 'my-coor-id-1', data: stringify('data1')},
            {correlationId: 'my-coor-id-2', data: stringify('data2')},
        ]

        const tracesLoader = new TracesLoader()
        tracesLoader.load(traces)

        function customIntegrationCallback(env, close, getData, wrap) {
            expect(env).toBe('dev')
            const data = getData('my-coor-id-2');
            expect(data).toBe('data2')

            return {
                module: mockModule,
                name: 'myCustomIntegration'
            }
        }

        const customIntegration = new CustomIntegration(customIntegrationCallback)
        customIntegration.init(undefined, tracesLoader, undefined)
    })

    it('should init custom integration and close transaction', function () {
        const trace: ITrace = {correlationId: 'my-coor-id-1', data: 'data1'}
        const tracer = new Tracer()

        function customIntegrationCallback(env, close, getData, wrap) {
            expect(env).toBe('dev')
            close(trace.data, trace.correlationId);

            return {
                module: mockModule,
                name: 'myCustomIntegration'
            }
        }

        const customIntegration = new CustomIntegration(customIntegrationCallback)
        customIntegration.init(tracer, undefined, undefined)

        expect(tracer.traces[0].correlationId).toBe('my-coor-id-1')
        expect(tracer.traces[0].data).toBe(stringify('data1'))
        expect(tracer.traces[0].operationType).toBe('CUSTOM')
        expect(tracer.traces[0].traceId).toBeDefined()
    })
});
