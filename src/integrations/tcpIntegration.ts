import {Tracer} from "../trace/Tracer";
import {TracesLoader} from "../trace/TracesLoader";
import {IIntegrationConfig} from "../config";
import {IIntegration} from "./index";
import {Integrations} from "./integrations";
import {ITrace, Trace} from "../trace/Trace";

const shimmer = require("shimmer");
const logger = require('../logger')

export class TcpIntegration extends Integrations implements IIntegration {
    private tracer: Tracer;
    private tracesLoader: TracesLoader;
    private config: IIntegrationConfig;
    private readonly namespace: string;
    private _net: null;
    private isListenerAttached: boolean;

    constructor() {
        super()
        this.namespace = 'tcpIntegration'
        this._net = null
        this.isListenerAttached = false
    }

    public init(tracer: Tracer, tracesLoader: TracesLoader, config: IIntegrationConfig) {
        this.tracer = tracer
        this.tracesLoader = tracesLoader
        this.config = config || {}

        const net = this.require("net");
        if (net) {
            this._net = net
            shimmer.wrap(net.Socket.prototype, 'connect', this.wrapConnect());
            shimmer.wrap(net.Socket.prototype, 'write', this.wrap());
            logger.info(`wrap tcp integration`, this.namespace)
        }
    }

    private wrapConnect() {
        const integration = this
        return function (connect) {
            return function (...args) {

                this.addListener('data', function (data) {
                    const obj: ITrace = {
                        data: data.toString(),
                        correlationId: this.correlationId
                    }

                    const trace = new Trace(obj);
                    integration.tracer.add(trace.trace())
                })

                try {
                    return connect.apply(this, args);
                } catch (error) {
                    logger.error(error, integration.namespace)
                    return connect.apply(this, arguments);
                }
            };
        }
    }

    private wrap() {
        const integration = this;
        return (write) => {
            return function (...args) {
                const rawData = args[0]
                this.correlationIdRawData = rawData
                this.correlationId = integration.hashSha1(rawData.toString())

                try {
                    return write.apply(this, args);
                } catch (error) {
                    console.log(error)
                    return write.apply(this, arguments);
                }
            };
        }
    }

    end(): void {
        if (this._net) {
            // @ts-ignore
            shimmer.unwrap(this._net.Socket.prototype, 'write');
            // @ts-ignore
            shimmer.unwrap(this._net.Socket.prototype, 'connect');

        }
    }
}


module.exports = {
    TcpIntegration
}
