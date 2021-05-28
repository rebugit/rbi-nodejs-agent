import {IIntegrationConfig} from "../config";
import {Tracer} from "../trace/Tracer";
import {TracesLoader} from "../trace/TracesLoader";
import {IIntegration} from "./index";
import {Environments} from "../sharedKernel/constants";
import {MongoDBCommandTypes} from "./constants";

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

    constructor() {
        super()

        this.env = process.env.REBUGIT_ENV
        this.namespace = 'mongodbIntegration'

        this.handleResponse = this.handleResponse.bind(this);
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
                shimmer.wrap(mongodb.MongoClient.prototype, 'db', this.wrap())
            }
        }
    }

    private wrap() {
        const integration = this
        return function (client) {
            return function (...args): any {
                logger.info(`executing main wrapper`, integration.namespace)
                console.log(args)
                console.log(client.toString())
                return client.apply(this, args)
            };
        }
    }

    private onStarted(event: any) {
        try {
            let hostPort: string[];
            const commandName: string = event.commandName
            const commandNameUpper: string = commandName.toUpperCase();
            const collectionName: string = event.command[commandName];
            const dbName: string = event.databaseName;
            const connectionId = event.connectionId;
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

            const operationType = MongoDBCommandTypes[commandNameUpper];
            const correlationId = this.getCorrelationIdMongo(hostPort, dbName, collectionName, commandName);
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
        logger.info("Success", this.namespace)
        logger.info(event)
    }

    protected getCorrelationIdMongo(
        hostPort: string[],
        dbName: string,
        collectionName: string,
        commandName: string
    ): string {
        const host = hostPort[0];
        const port = hostPort.length === 2 ? hostPort[1] : '';
        return `${host}:${port}_${dbName}_${collectionName}_${commandName}`
    }

    private handleResponse(value: any, statement: string): any {
        if (this.env === 'debug') {
        } else {
        }
    }

    private getExtraFieldsFromRes(res: any, data: any) {
        if (this.config.extraFields) {
            this.config.extraFields.forEach(field => {
                data[field] = res[field]
            })
        }
    }

    end() {
    }
}