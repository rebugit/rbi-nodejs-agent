import {IIntegration} from "./index";
import {Integrations} from "./integrations";
import {Tracer} from "../trace/Tracer";
import {TracesLoader} from "../trace/TracesLoader";
import {IIntegrationConfig} from "../config";
import {ITrace, Trace} from "../trace/Trace";
import {integrationType} from "./constants";

const logger = require('../logger')
const shimmer = require('shimmer')

export type customIntegrationCallback = (
    env: string,
    close: (data: any, correlationId: string) => void,
    getData: (correlationId: string) => any,
    wrap: (module: any, method: string, callback: (original: any) => any) => any
) => { module: any, name: string }

/**
 * This is the class to extend for Custom integration, we use shimmer.js you can pass the
 * same callback signature in the the callback field: https://github.com/othiym23/shimmer
 */
export class CustomIntegration extends Integrations implements IIntegration {
    private tracer: Tracer;
    private tracesLoader: TracesLoader;
    private config: IIntegrationConfig;
    private name: string;
    private module: any;
    private readonly callback: customIntegrationCallback;

    constructor(customIntegrationCallback: customIntegrationCallback) {
        super();

        this.retrieveData = this.retrieveData.bind(this);
        this.close = this.close.bind(this);

        this.callback = customIntegrationCallback
    }

    end(): void {
        shimmer.unwrap(this.module, this.name)
    }

    init(tracer: Tracer, tracesLoader: TracesLoader, config: IIntegrationConfig) {
        this.tracer = tracer
        this.tracesLoader = tracesLoader
        this.config = config || {}

        const {module, name} = this.callback(
            this.env,
            this.close,
            this.retrieveData,
            shimmer.wrap
        );

        this.module = module
        this.name = name
    }

    private close(data: any, correlationId: string) {
        const obj: ITrace = {
            data,
            correlationId,
            operationType: integrationType.CUSTOM
        }

        const trace = new Trace(obj);
        this.tracer.add(trace.trace())
    }

    private retrieveData(correlationId: string): any {
        const data = this.tracesLoader.get<any>(correlationId);
        logger.info(`trace loaded: ${data}`, this.name)

        return data
    }
}
