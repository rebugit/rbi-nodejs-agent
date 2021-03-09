import {Tracer} from "../trace/Tracer";
import {TracesLoader} from "../trace/TracesLoader";
import {IIntegrationConfig} from "../config";
import {IIntegration} from "./index";
import {Integrations} from "./integrations";

const shimmer = require("shimmer");
const logger = require('../logger')

/**
 * This might worth explore more
 * TODO: not implemented
 */
export class TcpIntegration extends Integrations implements IIntegration {
    private tracer: Tracer;
    private tracesLoader: TracesLoader;
    private config: IIntegrationConfig;
    private readonly namespace: string;
    private _net: null;

    constructor() {
        super()
        this.namespace = 'tcpIntegration'
        this._net = null
    }

    public init(tracer: Tracer, tracesLoader: TracesLoader, config: IIntegrationConfig) {
        this.tracer = tracer
        this.tracesLoader = tracesLoader
        this.config = config || {}

        const net = this.require("net");
        if (net) {
            this._net = net
            // shimmer.wrap(net.Socket.prototype, 'write', this.wrap());
            shimmer.wrap(net.Socket.prototype, 'on', this.wrap());
            logger.info(`wrap http integration`, this.namespace)
        }
    }

    private wrap() {
        return (original) => {
            return function (...args) {
                if (args[0] === 'data') {
                    const originalCallback = args[1]
                    args[1] = function (...args) {
                        /**
                         * If we use console.log we will trigger this function again
                         * creating an unwanted recursion
                         */
                        process.stdout.write(args.toString() + '\n');
                        originalCallback(...args)
                    }
                }

                return original.apply(this, args)
            };
        }
    }

    end(): void {
        // @ts-ignore
        shimmer.wrap(this._net.Socket.prototype, 'on', this.wrap());
    }
}


module.exports = {
    TcpIntegration
}
