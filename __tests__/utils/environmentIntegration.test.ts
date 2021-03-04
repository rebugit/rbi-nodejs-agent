import {EnvironmentIntegration} from "../../src/integrations/environmentIntegration";
import {Tracer} from "../../src/trace/Tracer";
import {TracesLoader} from "../../src/trace/TracesLoader";
import {parse, stringify} from "flatted";
import {integrationType} from "../../src/integrations/constants";

const clearEnvironmentVariables = () => {
    for (const key of Object.keys(process.env)) {
        if (key === 'NODE_ENV') continue
        delete process.env[key];
    }
};

describe('EnvironmentIntegration', function () {
    it('should save the environment', function () {
        clearEnvironmentVariables()

        process.env.CUSTOM_ENV_1 = 'env1'
        process.env.CUSTOM_ENV_2 = 'env2'
        process.env.CUSTOM_ENV_3 = 'env3'
        process.env.CUSTOM_ENV_BLACKLISTED = 'env4'
        process.env.REBUGIT_SOMETHING = 'debug'

        const tracer = new Tracer()
        const tracesLoader = new TracesLoader()
        const env = new EnvironmentIntegration()


        env.init(
            tracer,
            tracesLoader,
            {
                blackListFields: [
                    "CUSTOM_ENV_BLACKLISTED",
                ]
            }
        )

        expect(tracer.traces.length).toBe(1)
        expect(parse(tracer.traces[0].data)).toEqual({
            NODE_ENV: 'test',
            CUSTOM_ENV_1: 'env1',
            CUSTOM_ENV_2: 'env2',
            CUSTOM_ENV_3: 'env3'
        })
        expect(tracer.traces[0].correlationId).toBe('ENVIRONMENT')
        expect(tracer.traces[0].operationType).toBe('ENVIRONMENT')

        delete process.env.REBUGIT_SOMETHING
    });

    it('should inject environment', function () {
        process.env.REBUGIT_ENV = 'debug'

        const tracer = new Tracer()
        const tracesLoader = new TracesLoader()
        tracesLoader.load([
            {
                operationType: integrationType.ENVIRONMENT,
                correlationId: integrationType.ENVIRONMENT,
                data: stringify({
                        NODE_ENV: 'test',
                        CUSTOM_ENV_1: 'env1',
                        CUSTOM_ENV_2: 'env2',
                        CUSTOM_ENV_3: 'env3'
                    }
                )
            }
        ])
        const env = new EnvironmentIntegration()
        env.init(tracer, tracesLoader, {})

        expect(process.env).toEqual({
            NODE_ENV: 'test',
            REBUGIT_ENV: 'debug',
            CUSTOM_ENV_1: 'env1',
            CUSTOM_ENV_2: 'env2',
            CUSTOM_ENV_3: 'env3'
        })
    });
});
