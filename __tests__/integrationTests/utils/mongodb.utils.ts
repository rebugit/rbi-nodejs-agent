import mongodb, {Collection, MongoClient} from 'mongodb'
import mongoose, {Model} from 'mongoose'

const MONGO_URL = 'mongodb://localhost:27017/testDB';

export const getMongooseModel = async (): Model<any> => {
    await mongoose.connect(MONGO_URL, {useNewUrlParser: true, useUnifiedTopology: true});
    // @ts-ignore
    return mongoose.model('testCollection', {a: String})
}

export const insertMongooseCollection = async (Model: Model<any>, docs: any[]) => {
    const promises = docs.map(doc => {
        const model = new Model(doc);
        return model.save()
    })

    return await Promise.all(promises)
}

export const findAllWithMongoose = async (Model: Model<any>) => {
    return Model.find({})
}

export const dropMongooseModel = async (Model: Model<any>) => {
    await Model.collection.drop();
}

export const closeMongooseConnection = async () => {
    await mongoose.connection.close()
}

export const getCollectionClient = async (): Promise<{ collection: Collection, client: MongoClient }> => {
    return new Promise((resolve) => {
        const MongoClient = mongodb.MongoClient;
        const dbName = 'testDB';
        const collectionName = 'testCollection';
        MongoClient.connect(MONGO_URL, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
            if (client) {
                const db = client.db(dbName);
                const collection = db.collection(collectionName);
                resolve({collection, client})
            }
        });
    });
}

export const findAll = async (collection: Collection): Promise<any> => {
    return new Promise((resolve, reject) => {
        collection.find({}).toArray(function (err, docs) {
            if (err) {
                reject(err)
                return
            }

            resolve(docs)
        });
    })
};

export const insertMany = async (collection: Collection, docs: any[]) => {
    return new Promise((resolve, reject) => {
        collection.insertMany(docs, function (err, result) {
            if (err) {
                reject(err)
                return
            }

            resolve(result)
        });
    })
};

export const update = async (collection: Collection, filter, update) => {
    return new Promise((resolve, reject) => {
        collection.updateOne(filter, update, function (err, result) {
            if (err) {
                reject(err)
                return
            }

            resolve(result)
        });
    });
};

export const dropCollection = async (collection: Collection) => {
    return new Promise((resolve, reject) => {
        collection.drop((err, result) => {
            if (err){
                reject(err)
                return
            }

            resolve(result)
        })
    });
};