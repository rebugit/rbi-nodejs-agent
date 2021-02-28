import {IIntegration} from "./index";
import {Integrations} from "./integrations";
import {Tracer} from "../trace/Tracer";
import {TracesLoader} from "../trace/TracesLoader";
import {IIntegrationConfig} from "../config";
import {ITrace, Trace} from "../trace/Trace";
import {stringify} from "flatted";

const logger = require('../logger')
const shimmer = require('shimmer')

export type customIntegrationCallback = (
    env: string,
    close: (data: any, correlationId: string) => void,
    getData: (correlationId: string) => any,
    wrap: (original: any) => any
) => { module: any, name: string }

/**
 * This is the class to extend for Custom integration, we use shimmer.js you can pass the
 * same callback signature in the the callback field: https://github.com/othiym23/shimmer
 */
export class CustomIntegration extends Integrations implements IIntegration {
    private tracer: Tracer;
    private tracesLoader: TracesLoader;
    private config: IIntegrationConfig;
    private readonly name: string;
    private readonly module: any;

    constructor(customIntegrationCallback: customIntegrationCallback) {
        super();

        const {module, name} = customIntegrationCallback(
            this.env,
            this.conclude,
            this.retrieveData,
            shimmer.wrap
        );

        this.module = module
        this.name = name
    }

    end(): void {
        shimmer.unwrap(this.module, this.name)
    }

    init(tracer: Tracer, tracesLoader: TracesLoader, config: IIntegrationConfig) {
        this.tracer = tracer
        this.tracesLoader = tracesLoader
        this.config = config || {}
    }

    private conclude(data: any, correlationId: string) {
        const obj: ITrace = {
            data: stringify(data),
            correlationId,
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
