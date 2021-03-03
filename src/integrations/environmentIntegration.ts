import {Integrations} from "./integrations";
import {IIntegration} from "./index";
import {Tracer} from "../trace/Tracer";
import {TracesLoader} from "../trace/TracesLoader";
import {IIntegrationConfig} from "../config";
import {Trace} from "../trace/Trace";
import {integrationType} from "./constants";

const logger = require('../logger')

export class EnvironmentIntegration extends Integrations implements IIntegration {
    private readonly namespace: string;
    private configuration: IIntegrationConfig;

    constructor() {
        super()

        this.namespace = 'environment'
    }

    end(): void {
        // no-op there no clean-up needed
    }

    init(tracer: Tracer, tracesLoader: TracesLoader, config: IIntegrationConfig) {
        this.configuration = config

        if (this.env === 'debug') {
            const data = tracesLoader.get<{ [key: string]: string }>(integrationType.ENVIRONMENT);
            logger.info(`trace loaded: ${data}`, this.namespace)
            this.injectEnvironment(data)

            logger.info(`environment: `, process.env)
        } else {
            const trace = new Trace({
                operationType: integrationType.ENVIRONMENT,
                correlationId: integrationType.ENVIRONMENT,
                data: this.selectEnvVariables(),
            })

            tracer.add(trace.trace())
        }
    }

    private selectEnvVariables(): { [key: string]: string } {
        const env: { [key: string]: string } = {}
        for (const key of Object.keys(process.env)) {
            // Skip the PATH variables
            if (key === "PATH") {
                continue
            }

            // Skip any blacklisted fields from the configuration
            if (this.configuration.blackListFields) {
                if (this.configuration.blackListFields.includes(key)) {
                    continue
                }
            }

            // Do not save our env variables (they might interfere)
            if (!key.toUpperCase().startsWith('REBUGIT_')) {
                env[key] = process.env[key]
            }
        }

        return env
    }

    private injectEnvironment(env: { [key: string]: string }) {
        Object.keys(env).forEach(key => {
            process.env[key] = env[key]
        })
    }
}
