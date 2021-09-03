import {Tracer} from "../../src/trace/Tracer";
import {TracesLoader} from "../../src/trace/TracesLoader";
import {clearEnvironmentVariables, nslookup} from "../utils";
import {MongodbIntegration} from "../../src/integrations/mongodbIntegration";
import {parse} from "flatted";
import {
    closeMongooseConnection,
    dropCollection, dropMongooseModel,
    findAll, findAllWithMongoose,
    getCollectionClient,
    getMongooseModel,
    insertMany,
    insertMongooseCollection
} from "./utils/mongodb.utils";
import {OperationsType} from "../../src/integrations/constants";
import {ObjectId} from 'mongodb';

describe('MongoDB Integration', function () {
    const docs = [{a: 1}, {a: 2}, {a: 3}]
    let mongoIntegration: MongodbIntegration
    let tracer: Tracer
    let testHostIp;

    beforeEach(async function () {
        // process.env.REBUGIT_LOG = 'ALL'
        tracer = new Tracer()
        const tracesLoader = new TracesLoader()
        mongoIntegration = new MongodbIntegration()
        await mongoIntegration.init(tracer, tracesLoader, {})
        testHostIp = await nslookup(process.env.TEST_HOST);
    });

    afterEach(function () {
        clearEnvironmentVariables()
        mongoIntegration.end()
    });

    it('should integrate with native mongodb client', async function () {
        const {collection, client} = await getCollectionClient()
        await insertMany(collection, docs)
        const response = await findAll(collection)
        await dropCollection(collection)
        await client.close()

        expect(tracer.traces.length).toBe(3)
        expect(tracer.traces[1].correlationId).toBe(`${testHostIp}:27017_testDB_testCollection_find_62d86fba75ec71165edaeb78d940d7b357539e32`)
        expect(tracer.traces[1].operationType).toBe(OperationsType.MONGODB_QUERY)
        expect(response).toEqual(parse(tracer.traces[1].data).reply.cursor.firstBatch.map(doc => ({
            ...doc,
            // @ts-ignore
            _id: ObjectId(doc._id)
        })))
    });

    it('should integrate with Mongoose', async function () {
        const model = await getMongooseModel();
        await insertMongooseCollection(model, docs)
        const response = await findAllWithMongoose(model);
        await dropMongooseModel(model)
        await closeMongooseConnection()

        expect(tracer.traces.length).toBe(5)
        expect(tracer.traces[1].correlationId).toBe(`${testHostIp}:27017_testDB_testcollections_insert_5a61e80988de2abc4076eb794e870b29569d72e3`)
        expect(tracer.traces[1].operationType).toBe(OperationsType.MONGODB_QUERY)
        expect(response.map(doc => delete doc._id)).toEqual(parse(tracer.traces[3].data).reply.cursor.firstBatch.map(doc => delete doc._id))
    });
});