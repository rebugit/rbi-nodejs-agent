const MongoClient = require('mongodb').MongoClient;

const mongodb = async () => {
    const url = 'mongodb://localhost:27017';
    const dbName = 'testdb';
    const client = new MongoClient(url);
    await client.connect();
    console.log('Connected successfully to server');

    const db = client.db(dbName);
    const collection = db.collection('documents');
    await collection.insertMany([{a: 1}, {a: 2}, {a: 3}])
    const result = await collection.find({}).toArray();
    await collection.drop();
    await client.close();

    return result
}

const clearEnvironmentVariables = () => {
    for (const key of Object.keys(process.env)) {
        if (key.toUpperCase().startsWith('REBUGIT_')) {
            delete process.env[key];
        }
    }
};

module.exports = {
    clearEnvironmentVariables,
}
