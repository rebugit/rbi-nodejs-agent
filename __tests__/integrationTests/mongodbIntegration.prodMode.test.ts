import {Tracer} from "../../src/trace/Tracer";
import {TracesLoader} from "../../src/trace/TracesLoader";
import {clearEnvironmentVariables} from "../utils";
import {MongodbIntegration} from "../../src/integrations/mongodbIntegration";
import {parse} from "flatted";
import {dropCollection, findAll, getCollectionClient, insertMany} from "./utils/mongodb.utils";
import {OperationsType} from "../../src/integrations/constants";
import {ObjectId} from 'mongodb';

describe('MongoDB Integration', function () {
    let mongoIntegration: MongodbIntegration
    let tracer: Tracer

    beforeEach(async function () {
        // process.env.REBUGIT_LOG = 'ALL'
        tracer = new Tracer()
        const tracesLoader = new TracesLoader()
        mongoIntegration = new MongodbIntegration()
        await mongoIntegration.init(tracer, tracesLoader, {})
    });

    afterEach(function () {
        clearEnvironmentVariables()
        mongoIntegration.end()
    });

    it('should integrate with native mongodb client', async function () {
        const docs = [{a: 1}, {a: 2}, {a: 3}]
        const {collection, client} = await getCollectionClient()
        await insertMany(collection, docs)
        const response = await findAll(collection)
        await dropCollection(collection)
        await client.close()

        expect(tracer.traces.length).toBe(3)
        expect(tracer.traces[1].correlationId).toBe('127.0.0.1:27017_testDB_testCollection_find_2')
        expect(tracer.traces[1].operationType).toBe(OperationsType.MONGODB_QUERY)
        expect(response).toEqual(parse(tracer.traces[1].data).reply.cursor.firstBatch.map(doc => ({
            ...doc,
            // @ts-ignore
            _id: ObjectId(doc._id)
        })))
    });
});