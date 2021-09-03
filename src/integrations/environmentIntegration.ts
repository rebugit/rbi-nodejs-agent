import {Integrations} from "./integrations";
import {IIntegration} from "./index";
import {Tracer} from "../trace/Tracer";
import {TracesLoader} from "../trace/TracesLoader";
import {IIntegrationConfig} from "../config";
import {Trace} from "../trace/Trace";
import {OperationsType} from "./constants";
import {Environments} from "../sharedKernel/constants";

const logger = require('../logger')

export class EnvironmentIntegration extends Integrations implements IIntegration {
    private readonly namespace: string;
    private configuration: IIntegrationConfig;

    constructor() {
        super()

        this.namespace = 'environmentIntegration'
    }

    end(): void {
        // no-op no clean-up needed
    }

    init(tracer: Tracer, tracesLoader: TracesLoader, config: IIntegrationConfig) {
        this.configuration = config || {}

        if (this.env === Environments.DEBUG) {
            this.cleanEnvironment()
            const data = tracesLoader.get<{ [key: string]: string }>(OperationsType.ENVIRONMENT);
            logger.info(`trace loaded: ${data}`, this.namespace)
            this.injectEnvironment(data)

            logger.info(`environment: ${process.env}`, this.namespace)
        } else {
            const trace = new Trace({
                operationType: OperationsType.ENVIRONMENT,
                correlationId: OperationsType.ENVIRONMENT,
                data: this.selectEnvVariables(),
            })

            tracer.add(trace.trace())
        }
    }

    private selectEnvVariables(): { [key: string]: string } {
        const env: { [key: string]: string } = {}
        for (const key of Object.keys(process.env)) {
            if (this.isBlackListed(key)) continue;
            if (this.isRebugitVariable(key)) continue;

            env[key] = process.env[key]
        }

        return env
    }

    private isBlackListed(key: string): boolean {
        // Skip any blacklisted fields from the configuration
        const blacklistFromConfig = this.configuration.blackListFields || []
        // merge the user supplied list with our own internal list
        const fullBlacklist = [...blacklistFromConfig, ...blacklistEnvironment]
        return fullBlacklist && fullBlacklist.includes(key)
    }

    private isRebugitVariable(key: string): boolean {
        return key.toUpperCase().startsWith('REBUGIT_')
    }

    private injectEnvironment(env: { [key: string]: string }) {
        Object.keys(env).forEach(key => {
            process.env[key] = env[key]
        })

        Object.keys(defaultEnvironment).forEach(key => {
            process.env[key] = defaultEnvironment[key]
        })
    }

    /**
     * This method will clean up our process environment variables.
     * It won't delete our SDK variables
     */
    private cleanEnvironment() {
        Object.keys(process.env).forEach(key => {
            if (this.isRebugitVariable(key)) return;
            if (this.isBlackListed(key)) return;
            delete process.env[key]
        })
    }
}

const blacklistEnvironment = ["PATH"]
const defaultEnvironment = {
    // We fake AWS credentials to avoid request to the metadata endpoint
    // or other mechanisms which would be difficult to mock
    AWS_ACCESS_KEY_ID: 'fake_access_key',
    AWS_SECRET_ACCESS_KEY: 'fake_secret_access_key'
}
