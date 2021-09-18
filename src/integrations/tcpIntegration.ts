import {Tracer} from "../trace/Tracer";
import {TracesLoader} from "../trace/TracesLoader";
import {IIntegrationConfig} from "../config";
import {IIntegration} from "./index";
import {Integrations} from "./integrations";
import {ITrace, Trace} from "../trace/Trace";
import {Environments} from "../sharedKernel/constants";
import {ChildProcess, fork} from "child_process";
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

    constructor() {
        super()
        this.namespace = 'tcpIntegration'
        this._net = null
        this.isListenerAttached = false
    }

    public async init(tracer: Tracer, tracesLoader: TracesLoader, config: IIntegrationConfig) {
        this.tracer = tracer
        this.tracesLoader = tracesLoader
        this.config = config || {}

        const net = this.require("net");
        if (net) {
            this._net = net
            logger.info(`wrap tcp integration`, this.namespace)

            if (this.env === Environments.DEBUG) {
                shimmer.wrap(net.Socket.prototype, 'connect', this.wrapMockConnect());
                shimmer.wrap(net.Socket.prototype, 'write', this.wrapMockWrite());
            } else {
                shimmer.wrap(net.Socket.prototype, 'connect', this.wrapConnect());
                shimmer.wrap(net.Socket.prototype, 'write', this.wrap());
            }
        }

        if (this.env === Environments.DEBUG) {
            const childProcess = this.spawnServer();
            this._childProcess = childProcess
            await this.waitForServerToBeReady(childProcess)
        }
    }

    private getCorrelation(request: string): string {
        if (request.includes("HTTP")) {
            // Remove all the non idempotent headers
            const newRequest = []
            request.split('\r\n').forEach(line => {
                if (line.includes("Host")){
                    return
                }

                newRequest.push(line)
            })
            console.log(newRequest)
            return this.hashSha1(newRequest.join(""))
        } else {
            return this.hashSha1(request)
        }
    }

    private sendDataChildProcess(process: ChildProcess, data: any) {
        process.send(JSON.stringify({type: 'data', data}))
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
                this.correlationId = integration.getCorrelation(rawData.toString())

                try {
                    return write.apply(this, args);
                } catch (error) {
                    console.log(error)
                    return write.apply(this, arguments);
                }
            };
        }
    }

    private wrapMockConnect() {
        const integration = this
        return function (connect) {
            return function (...args: any[]) {
                const newArgs = [...args]
                console.log(newArgs)
                newArgs[0][0].host = 'localhost'
                newArgs[0][0].port = '52000'
                newArgs[0][0].servername = 'localhost'

                try {
                    return connect.apply(this, newArgs);
                } catch (error) {
                    logger.error(error, integration.namespace)
                    return connect.apply(this, arguments);
                }
            };
        }
    }

    private wrapMockWrite() {
        const integration = this;
        return (write) => {
            return function (...args) {
                const rawData = args[0]
                this.correlationIdRawData = rawData
                const correlationId = integration.getCorrelation(rawData.toString())

                const data = integration.tracesLoader.get<any>(correlationId);
                logger.info(`correlation id: ${correlationId}`, integration.namespace)
                logger.info(`trace loaded: ${data}`, integration.namespace)

                args[0] = data
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
            if (this.env === Environments.DEBUG) {
                // @ts-ignore
                shimmer.unwrap(this._net.Socket.prototype, 'connect');
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
