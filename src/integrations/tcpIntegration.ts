import {Tracer} from "../trace/Tracer";
import {TracesLoader} from "../trace/TracesLoader";
import {IIntegrationConfig} from "../config";
import {IIntegration} from "./index";
import {Integrations} from "./integrations";
import {ITrace, Trace} from "../trace/Trace";
import {Environments} from "../sharedKernel/constants";
import {ChildProcess, fork} from "child_process";
import {v4 as uuidV4} from 'uuid';
import path from "path";

const shimmer = require("shimmer");
const logger = require('../logger')

export class TcpIntegration extends Integrations implements IIntegration {
    private tracer: Tracer;
    private tracesLoader: TracesLoader;
    private config: IIntegrationConfig;
    private readonly namespace: string;
    private _net: null;
    private isListenerAttached: boolean;
    private _childProcess: ChildProcess;
    private readonly DEBUG_HOST_NAME: string;
    private readonly DEBUG_HOST_PORT: number;
    private _tls: any;
    private correlations: {};

    constructor() {
        super()
        this.namespace = 'tcpIntegration'
        this._net = null
        this.isListenerAttached = false
        this.DEBUG_HOST_NAME = 'localhost'
        this.DEBUG_HOST_PORT = 52000
        this.correlations = {}
    }

    public async init(tracer: Tracer, tracesLoader: TracesLoader, config: IIntegrationConfig) {
        this.tracer = tracer
        this.tracesLoader = tracesLoader
        this.config = config || {}

        const net = this.require("net");
        if (net) {
            this._net = net
            if (this.env === Environments.DEBUG) {
                shimmer.wrap(net.Socket.prototype, 'connect', this.wrapMockConnect());
                shimmer.wrap(net.Socket.prototype, 'write', this.wrapMockWrite());
                logger.info(`wrap tcp integration in debug mode`, this.namespace)

                const tls = this.require("tls");
                if (tls) {
                    this._tls = tls
                    shimmer.wrap(tls, 'connect', this.wrapMockConnectTLS());
                    logger.info(`wrap tls integration in debug mode`, this.namespace)
                }
            } else {
                shimmer.wrap(net.Socket.prototype, 'connect', this.wrapConnect());
                shimmer.wrap(net.Socket.prototype, 'write', this.wrapWrite());
                logger.info(`wrap tcp integration`, this.namespace)
            }
        }

        if (this.env === Environments.DEBUG) {
            const childProcess = this.spawnServer();
            this._childProcess = childProcess
            await this.waitForServerToBeReady(childProcess)
        }
    }

    private getCorrelation(request: string, __socket): string {
        return request
    }

    private killChildProcess(process: ChildProcess) {
        process.send(JSON.stringify({type: 'shutdown'}))
    }

    private spawnServer(): ChildProcess {
        logger.info('forking process', this.namespace)
        return fork(
            path.join(__dirname, 'servers', 'tcpServer.js'),
            [],
            {
                detached: false,
                execArgv: []
            },
        )
    }

    private waitForServerToBeReady(childProcess: ChildProcess) {
        return new Promise((resolve, reject) => {
            childProcess.once('message', (mes) => {
                if (mes === 'serverReady') {
                    logger.info('Server ready', this.namespace)
                    return resolve('connected');
                }

                return reject('failed to connect');
            });
        })
    }

    private wrapConnect() {
        const integration = this
        return function (connect) {
            return function (...args) {
                const rebugitRequestId = uuidV4()
                this.__rebugitRequestId = rebugitRequestId

                this.addListener('data', function (data) {
                    const obj: ITrace = {
                        data: data.toString(),
                        correlationId: integration.correlations[rebugitRequestId]
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

    private wrapWrite() {
        const integration = this;
        return (write) => {
            return function (...args) {
                const rawData = args[0]
                this.correlationIdRawData = rawData
                const correlationId = integration.getCorrelation(rawData.toString(), this)
                if (!this.remoteAddress) {
                    if (!correlationId) {
                        return write.apply(this, args);
                    }
                }

                integration.correlations[this.__rebugitRequestId] = correlationId

                try {
                    return write.apply(this, args);
                } catch (error) {
                    logger.error(error, integration.namespace)
                    return write.apply(this, arguments);
                }
            };
        }
    }

    private wrapMockConnectTLS() {
        const integration = this
        return function (connect) {
            return function (...args: any[]) {
                try {
                    // Effectively _net is never going to be null
                    // because is contained inside nodejs standard library
                    // @ts-ignore
                    const socket = new integration._net.Socket()
                    return socket.connect(...args)
                } catch (error) {
                    logger.error(error, integration.namespace)
                    throw error
                }
            };
        }
    }

    private wrapMockConnect() {
        const integration = this
        return function (connect) {
            return function (...args: any[]) {
                const __self = this
                const newArgs = integration.normalizeArgs(args, __self)

                try {
                    return connect.apply(this, newArgs);
                } catch (error) {
                    logger.error(error, integration.namespace)
                    throw error
                }
            };
        }
    }

    private wrapMockWrite() {
        const integration = this;
        return (write) => {
            return function (...args) {
                const rawData = args[0]
                const correlationId = integration.getCorrelation(rawData.toString(), this)
                const data = integration.tracesLoader.get<any>(correlationId);
                logger.info(`correlation id: ${correlationId}`, integration.namespace)
                logger.info(`trace loaded: ${data}`, integration.namespace)

                args[0] = data
                try {
                    return write.apply(this, args);
                } catch (error) {
                    logger.error(error, integration.namespace)
                    throw error
                }
            };
        }
    }

    private normalizeArgs(args, __socket): any {
        if (args[0][0]) {
            const firstArg = args[0][0]
            if (this.type(firstArg) === "Object") {
                __socket.originalRemoteHost = args[0][0].host
                __socket.originalRemotePort = args[0][0].port
                args[0][0].host = this.DEBUG_HOST_NAME
                args[0][0].port = this.DEBUG_HOST_PORT
                args[0][0].servername = this.DEBUG_HOST_NAME
                return args
            }

            if (this.type(firstArg) === "String") {

            }

            if (this.type(firstArg) === "Number") {

            }

        } else {
            const firstArg = args[0]
            if (this.type(firstArg) === "Object") {
                __socket.originalRemoteHost = args[0].host
                __socket.originalRemotePort = args[0].port
                const newArgs = []
                newArgs[0] = {}
                newArgs[0].host = this.DEBUG_HOST_NAME
                newArgs[0].port = this.DEBUG_HOST_PORT
                newArgs[0].servername = this.DEBUG_HOST_NAME
                newArgs[0].hostname = this.DEBUG_HOST_NAME
                newArgs[1] = args[1]
                return newArgs
            }

            if (this.type(firstArg) === "String") {

            }

            if (this.type(firstArg) === "Number") {

            }
        }
    }

    private type(val) {
        return Object.prototype.toString.call(val).slice(8, -1);
    }

    end(): void {
        if (this._net) {
            if (this.env === Environments.DEBUG) {
                // @ts-ignore
                shimmer.unwrap(this._net.Socket.prototype, 'connect');
                // @ts-ignore
                shimmer.unwrap(this._net.Socket.prototype, 'write');
                shimmer.unwrap(this._tls, 'connect')

                this.killChildProcess(this._childProcess)
                this._childProcess = null
            } else {
                // @ts-ignore
                shimmer.unwrap(this._net.Socket.prototype, 'write');
                // @ts-ignore
                shimmer.unwrap(this._net.Socket.prototype, 'connect');
            }
        }
    }
}


module.exports = {
    TcpIntegration
}
