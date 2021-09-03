import {IIntegrationConfig} from "../config";
import {Tracer} from "../trace/Tracer";
import {TracesLoader} from "../trace/TracesLoader";
import {IIntegration} from "./index";
import {Environments} from "../sharedKernel/constants";
import {OperationsType} from "./constants";
import {Trace} from "../trace/Trace";
import cloneDeep from "lodash.clonedeep";
import {ChildProcess, fork} from "child_process";
import path from "path";
import {parse, URL} from 'url'

const shimmer = require("shimmer");
const logger = require('../logger')
const {Integrations} = require("./integrations");

export class MongodbIntegration extends Integrations implements IIntegration {
    private tracer: Tracer;
    private tracesLoader: TracesLoader;
    private readonly env: string;
    private config: IIntegrationConfig;
    private readonly namespace: string;
    private mongodb: any;
    private blacklistedCommands: string[];
    private traceMap: { [key: string]: Trace };
    private mockServerId: string;
    private mockServerPort: number;

    constructor() {
        super()

        this.env = process.env.REBUGIT_ENV
        this.namespace = 'mongodbIntegration'
        this.mockServerId = 'mongodb_ready'
        this.mockServerPort = 52001
        this.blacklistedCommands = ['endSessions']
        this.traceMap = {}
    }

    public async init(tracer: Tracer, tracesLoader: TracesLoader, config: IIntegrationConfig) {
        this.tracer = tracer
        this.tracesLoader = tracesLoader
        this.config = config || {}

        // if (this.env === Environments.DEBUG) {
        //     const childProcess = this.spawnServer();
        //     this._childProcess = childProcess
        //     await this.waitForServerToBeReady(childProcess)
        // }

        const mongodb = this.require("mongodb");
        if (mongodb) {
            this.mongodb = mongodb

            if (this.env === Environments.DEBUG) {
                // const instrument = mongodb.instrument();
                // shimmer.wrap(mongodb.MongoClient, 'connect', this.wrapMock())
            } else {
                const instrument = mongodb.instrument();
                instrument.on('started', this.onStarted.bind(this))
                instrument.on('failed', this.onFailed.bind(this))
                instrument.on('succeeded', this.onSuccess.bind(this))
                shimmer.wrap(mongodb.MongoClient, 'connect', this.wrap())
            }
        }
    }

    private wrapMock() {
        const integration = this;
        return function (connect) {
            return function (...args) {
                const url = new URL(args[0]);
                url.hostname = "localhost"
                url.port = integration.mockServerPort.toString()
                const mockUrl = url.toString();
                console.log(mockUrl)

                const newArgs = [...args]
                newArgs[0] = mockUrl

                logger.info(`executing connect wrapper mock`, integration.namespace)
                return connect.apply(this, newArgs)
            }
        };
    }

    private wrap() {
        const integration = this
        return function (connect) {
            return function (...args): any {
                logger.info(`executing connect wrapper`, integration.namespace)
                return connect.apply(this, args)
            };
        }
    }

    private onStarted(event: any) {
        try {
            const commandName: string = event.commandName
            if (this.blacklistedCommands.includes(commandName)) {
                return
            }
            logger.info(`onStarted command: ${commandName}`, this.namespace)

            let hostPort: string[];
            const command: any = event.command
            const collectionName: string = event.command[commandName];
            const dbName: string = event.databaseName;
            const connectionId = event.connectionId;
            const requestId = event.requestId
            if (typeof connectionId === 'object') {
                hostPort = [
                    connectionId.host,
                    connectionId.port
                ];
            } else if (typeof connectionId === 'string') {
                hostPort = connectionId.split(':', 2);
            } else if (typeof connectionId === 'number') {
                const address = event.address;
                hostPort = address.split(':', 2);
            }

            const correlationId = this.getCorrelationIdMongo(hostPort, dbName, collectionName, commandName, command);
            this.traceMap[requestId] = new Trace({
                operationType: OperationsType.MONGODB_QUERY,
                correlationId,
                data: {}
            })

            logger.info(`correlationId: ${correlationId}`, this.namespace)
        } catch (error) {
            logger.error(error, this.namespace)
        }
    }

    private onFailed(event: any) {
        logger.info("Failed", this.namespace)
        logger.info(event)
    }

    private onSuccess(event: any) {
        try {
            const commandName = event.commandName
            const requestId = event.requestId
            if (!this.blacklistedCommands.includes(commandName)) {
                logger.info(`onSuccess event command: ${commandName}`, this.namespace)

                const currentTrace = this.traceMap[requestId]
                currentTrace.data = event
                this.tracer.add(currentTrace.trace())
                delete this.traceMap[requestId]
            }
        } catch (e) {
            logger.error(e, this.namespace)
        }
    }

    /**
     * TODO: explain the logic
     */
    protected getCorrelationIdMongo(
        hostPort: string[],
        dbName: string,
        collectionName: string,
        commandName: string,
        command: any
    ): string {
        let stringCommand
        const clonedCommand = cloneDeep(command);
        delete clonedCommand.lsid
        if (commandName === 'insert') {
            clonedCommand.documents = clonedCommand.documents.map(doc => {
                delete doc._id
                delete doc.__v
            })
            stringCommand = JSON.stringify(clonedCommand)
        } else {
            stringCommand = JSON.stringify(clonedCommand)
        }
        const host = hostPort[0];
        const port = hostPort.length === 2 ? hostPort[1] : '';
        return `${host}:${port}_${dbName}_${collectionName}_${commandName}_${this.hashSha1(stringCommand)}`
    }

    private getExtraFieldsFromRes(res: any, data: any) {
        if (this.config.extraFields) {
            this.config.extraFields.forEach(field => {
                data[field] = res[field]
            })
        }
    }


    private waitForServerToBeReady(childProcess: ChildProcess) {
        const integration = this
        return new Promise((resolve, reject) => {
            childProcess.once('message', (mes) => {
                if (mes === integration.mockServerId) {
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
            path.join(__dirname, 'servers', 'mongodbServer.js'),
            [],
            {
                detached: false,
                execArgv: []
            },
        )
    }

    end() {
        if (this.mongodb) {
            this.traceMap = {}
            shimmer.unwrap(this.mongodb.MongoClient, 'connect')
        }
    }
}