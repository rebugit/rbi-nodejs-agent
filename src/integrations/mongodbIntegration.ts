import {IIntegrationConfig} from "../config";
import {Tracer} from "../trace/Tracer";
import {TracesLoader} from "../trace/TracesLoader";
import {IIntegration} from "./index";
import {Environments} from "../sharedKernel/constants";
import {OperationsType} from "./constants";
import {Trace} from "../trace/Trace";

const shimmer = require("shimmer");
const logger = require('../logger')
const {Integrations} = require("./integrations");
const BSON = require('bson')

export class MongodbIntegration extends Integrations implements IIntegration {
    private tracer: Tracer;
    private tracesLoader: TracesLoader;
    private readonly env: string;
    private config: IIntegrationConfig;
    private readonly namespace: string;
    private mongodb: any;
    private _trace: Trace;
    private blacklistedCommands: string[];

    constructor() {
        super()

        this.env = process.env.REBUGIT_ENV
        this.namespace = 'mongodbIntegration'
        this.blacklistedCommands = ['endSessions']
    }

    init(tracer: Tracer, tracesLoader: TracesLoader, config: IIntegrationConfig) {
        this.tracer = tracer
        this.tracesLoader = tracesLoader
        this.config = config || {}

        const mongodb = this.require("mongodb");
        if (mongodb) {
            this.mongodb = mongodb

            /**
             * In debug mode we need to mock extra methods,
             * one of those is connect since we need to avoid connecting to the physical database
             */
            if (this.env === Environments.DEBUG) {
            } else {
                const instrument = mongodb.instrument();
                instrument.on('started', this.onStarted.bind(this))
                instrument.on('failed', this.onFailed.bind(this))
                instrument.on('succeeded', this.onSuccess.bind(this))
                shimmer.wrap(mongodb.MongoClient, 'connect', this.wrap())
            }
        }
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

            const correlationId = this.getCorrelationIdMongo(hostPort, dbName, collectionName, commandName, requestId);
            this._trace = new Trace({
                operationType: OperationsType.MONGODB_QUERY,
                correlationId,
                data: {}
            })

            logger.info(`correlationId: ${correlationId}`, this.namespace)
        } catch (error) {
            console.log(error)
        }
    }

    private onFailed(event: any) {
        logger.info("Failed", this.namespace)
        logger.info(event)
    }

    private onSuccess(event: any) {
        if (this._trace) {
            const commandName = event.commandName
            logger.info(`onSuccess event command: ${commandName}`, this.namespace)

            this._trace.data = event
            this.tracer.add(this._trace.trace())
            this._trace = null
        }
    }

    protected getCorrelationIdMongo(
        hostPort: string[],
        dbName: string,
        collectionName: string,
        commandName: string,
        requestId: string
    ): string {
        const host = hostPort[0];
        const port = hostPort.length === 2 ? hostPort[1] : '';
        return `${host}:${port}_${dbName}_${collectionName}_${commandName}_${requestId}`
    }

    private getExtraFieldsFromRes(res: any, data: any) {
        if (this.config.extraFields) {
            this.config.extraFields.forEach(field => {
                data[field] = res[field]
            })
        }
    }

    end() {
        if (this.mongodb) {
            shimmer.unwrap(this.mongodb.MongoClient, 'connect')
        }
    }
}