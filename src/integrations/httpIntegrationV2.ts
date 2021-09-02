import {Tracer} from "../trace/Tracer";
import {TracesLoader} from "../trace/TracesLoader";
import {IIntegrationConfig} from "../config";
import {IIntegration} from "./index";
import {Integrations} from "./integrations";
import {IncomingHttpHeaders, IncomingMessage, RequestOptions} from "http";
import {ITrace} from "../trace/Trace";
import path from "path";
import {ChildProcess} from "child_process";
import {Environments} from "../sharedKernel/constants";

const url = require("url");
const shimmer = require("shimmer");
const {Trace} = require('../trace/Trace')
const logger = require('../logger')
const {fork} = require('child_process');

interface IHttpTraceData {
    body: any
    headers: IncomingHttpHeaders,
    statusCode: number,
    statusMessage: string
}

/**
 * This integration works differently from the previous one. Instead of heavily monkey patching
 * it will spawn a sever as child process and simply change host and port
 */
export class HttpIntegrationV2 extends Integrations implements IIntegration {
    private tracer: Tracer;
    private tracesLoader: TracesLoader;
    private config: IIntegrationConfig;
    private readonly namespace: string;
    private _http: null;
    private _https: null;
    private _childProcess: ChildProcess;

    constructor() {
        super()
        this.namespace = 'httpIntegration'
        this._http = null
        this._https = null
    }

    public async init(tracer: Tracer, tracesLoader: TracesLoader, config: IIntegrationConfig) {
        this.tracer = tracer
        this.tracesLoader = tracesLoader
        this.config = config || {}

        if (this.env === Environments.DEBUG) {
            const childProcess = this.spawnServer();
            this._childProcess = childProcess
            await this.waitForServerToBeReady(childProcess)
        }

        const http = this.require("http");
        if (http) {
            this._http = http
            if (this.env === Environments.DEBUG) {
                shimmer.wrap(http, 'request', this.wrapMock());
                logger.info(`wrap http mock integration`, this.namespace)
            } else {
                shimmer.wrap(http, 'request', this.wrap());
                logger.info(`wrap http integration`, this.namespace)
            }
        }

        const https = this.require("https");
        if (https) {
            this._https = https
            if (this.env === Environments.DEBUG) {
                shimmer.wrap(https, 'request', this.wrapMock());
                logger.info(`wrap https mock integration`, this.namespace)
            } else {
                shimmer.wrap(https, 'request', this.wrap());
                logger.info(`wrap https integration`, this.namespace)
            }
        }
    }

    private getExtraFieldsFromRes(res: IncomingMessage, data: IHttpTraceData) {
        if (this.config.extraFields) {
            this.config.extraFields.forEach(field => {
                data[field] = res[field]
            })
        }
    }

    private addExtraFieldsToRes(res: IncomingMessage, data: IHttpTraceData) {
        if (this.config.extraFields) {
            this.config.extraFields.forEach(field => {
                res[field] = data[field]
            })
        }
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

    private spawnServer(): ChildProcess {
        logger.info('forking process', this.namespace)
        return fork(
            path.join(__dirname, 'servers', 'httpServer.js'),
            [],
            {
                detached: false,
                execArgv: []
            },
        )
    }

    private sendDataChildProcess(process: ChildProcess, data: IHttpTraceData) {
        process.send(JSON.stringify({type: 'data', data}))
    }

    private killChildProcess(process: ChildProcess) {
        process.send(JSON.stringify({type: 'shutdown'}))
    }

    private injectData(options: RequestOptions, body: string) {
        const correlationId = this.getCorrelationId(options.method, options.host, options.path, options.headers, body);
        const data = this.tracesLoader.get<IHttpTraceData>(correlationId);
        logger.info(`correlation id: ${correlationId}`, this.namespace)
        logger.info(`trace loaded: ${data}`, this.namespace)
        this.sendDataChildProcess(this._childProcess, data)
    }

    private wrapMock() {
        const integration = this
        return (request) => {
            return function (...args: any[]) {
                const newArgs = [...args]

                newArgs[0].host = 'localhost'
                newArgs[0].port = 52000
                newArgs[0].hostname = 'localhost'

                const {options} = integration.parseArgs(...newArgs);
                const req = request.apply(this, newArgs)

                let body: string
                const originalWrite = req.write
                req.write = function (...args) {
                    body = args[0]
                    integration.injectData(options, body)
                    originalWrite.call(this, ...args)
                }

                integration.injectData(options, body)

                return req
            }
        }
    }

    private wrap() {
        const integration = this
        return (request) => {
            return function (...args: any[]) {
                const newArgs = [...args]
                const {options, callback: originalCallback} = integration.parseArgs(...newArgs);

                try {
                    const wrappedCallback = (res: IncomingMessage) => {
                        let output = '';

                        res.on('data', (chunk) => {
                            output += chunk;
                        });

                        res.on('end', () => {
                            const data: IHttpTraceData = {
                                body: output,
                                headers: res.headers,
                                statusCode: res.statusCode,
                                statusMessage: res.statusMessage
                            }

                            integration.getExtraFieldsFromRes(res, data)

                            const obj: ITrace = {
                                data,
                                correlationId,
                                operationType: operationType
                            }

                            const trace = new Trace(obj);
                            integration.tracer.add(trace.trace())
                        });

                        if (originalCallback) {
                            originalCallback(res)
                        }
                    };

                    newArgs[1] = wrappedCallback
                    const req = request.call(this, ...newArgs);
                    const originalWrite = req.write

                    /**
                     * We need to capture the body which will be used for the correlationId computation
                     */
                    let body: string
                    let correlationId: string
                    req.write = function (...args) {
                        body = args[0]
                        correlationId = integration.getCorrelationId(options.method, options.host, options.path, options.headers, body);
                        logger.info(`correlation id: ${correlationId}`, integration.namespace);

                        originalWrite.call(this, ...args)
                    }

                    // If the request has no body we will compute the correlationId here
                    // Since the `.write` method won't be called
                    // Some packages (AWS sdk) pass the body via headers
                    correlationId = integration.getCorrelationId(options.method, options.host, options.path, options.headers, body);
                    logger.info(`correlation id: ${correlationId}`, integration.namespace);

                    const operationType = integration.getOperationType(options.headers);

                    return req
                } catch (error) {
                    logger.error(error, integration.namespace)
                    return request.apply(this, arguments);
                }
            };
        }
    }

    private parseArgs(...newArgs: any[]) {
        let options: RequestOptions | any = newArgs[0];

        let method = ''
        if (options.method) {
            method = options.method.toUpperCase();
        } else {
            method = arguments[1].method;
        }

        const host = options.hostname || options.host || 'localhost'
        options = typeof options === 'string' ? url.parse(options) : options;
        let path = options.path || options.pathname || '/';
        const headers = options.headers || {}
        const port = options.port

        let originalCallback
        if (options.callback) {
            originalCallback = options.callback
        } else { // @ts-ignore
            if (typeof arguments[1] === "function") {
                originalCallback = arguments[1]
            } else if (arguments[2] && typeof arguments[2] === 'function') {
                originalCallback = arguments[2]
            }
        }

        return {
            options: {
                method, host, path, headers, port
            },
            callback: originalCallback
        }
    }

    end(): void {
        if (this.env === Environments.DEBUG) {
            this.killChildProcess(this._childProcess)
            this._childProcess = null
        }

        if (this._http) {
            shimmer.unwrap(this._http, 'request');
            logger.info(`unwrap http integration`, this.namespace)
            this._http = null

        }

        if (this._https) {
            shimmer.unwrap(this._https, 'request');
            logger.info(`unwrap https integration`, this.namespace)
            this._https = null
        }
    }
}