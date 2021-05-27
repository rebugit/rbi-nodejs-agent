const http = require("http");
const {Sequelize} = require('sequelize')
const {RebugitSDK} = require('rbi-nodejs-agent');
const {Pool} = require('pg')
const axios = require('axios')
const cors = require('cors')
const bodyParser = require('body-parser')
const express = require('express')
const request = require('request')
const app = express()
const port = 9000
const AWS = require('aws-sdk');

process.env.REBUGIT_LOG = 'ALL'

const Rebugit = new RebugitSDK({
    apiKey: process.env.REBUGIT_API_KEY,
    collector: {
        collectorBaseUrl: "dev.api.rebugit.com"
    }
})

const dynamoDb = new AWS.DynamoDB.DocumentClient({
    region: 'ap-southeast-1'
});

const getForecast = async () => {
    const response = await dynamoDb.get({
        TableName: 'rebugit-nodejs-lambda-example-dev',
        Key: {
            id: '155ed150-9295-11eb-8c38-5fede2f3bc0d'
        }
    }).promise()
    return response.Item
}

const isSequelize = false
const isAxios = true
const pg = new Pool({
    user: 'postgres',
    database: 'postgres',
    host: 'localhost',
    password: 'postgres',
    port: 5435
})
const sequelize = new Sequelize('postgres://postgres:postgres@localhost:5433/postgres') // Example for postgres
const getDataFromDatabase = async () => {
    if (isSequelize){
        const res = await sequelize.query('SELECT 1 + 5 * :multi AS result', {
            replacements: {
                'multi': 4
            }
        })
        return res[0][0].result
    }

    const client = await pg.connect();
    const res = await client.query('SELECT 1 + 5 * $1 AS result', [4])
    await client.release()
    return res.rows[0].result
}

const requestWithRequest = () => new Promise((resolve, reject) => {
    request('http://jsonplaceholder.typicode.com/todos/1', function (error, response, body) {
        if (error){
            return reject(error)
        }
        resolve(JSON.parse(body))
    });
})

const callExternalAPI = async () => {
    if (isAxios){
        const resp = await axios.get('http://jsonplaceholder.typicode.com/todos/1')
        return resp.data
    } else {
        const options = {
            host: 'jsonplaceholder.typicode.com',
            path: '/todos/1',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        };

        return new Promise((resolve, reject) => {
            const req = http.request(options, (res) => {
                console.log(`${options.host} : ${res.statusCode}`);
                res.setEncoding('utf8');
                let output = '';

                res.on('data', (chunk) => {
                    output += chunk;
                });

                res.on('end', () => {
                    let obj = JSON.parse(output);
                    resolve(obj);
                });
            });

            req.on('error', (err) => {
                console.log(err.message)
                reject(err)
            });

            req.end();
        })
    }
}

const doStuff = async (req, res, next) => {
    const {num} = req.body
    console.log("Received number: ", num)

    const data = await callExternalAPI();
    console.log("external call: ", data)

    const moreData = await getDataFromDatabase()
    console.log('From db', moreData)

    console.log("Title: ", data.title)

    const length = data.title.length;
    console.log("Title length: ", length)

    if (process.env.CUSTOM_ENV === 'allowError'){
        if (length - num === 0) {
            return next(new Error("Error: division by 0!!"))
        }
    }

    const magicNumber = 18 / (length - num)
    // const newVar = await getForecast();

    res.status(200).send({
        magicNumber
    })
}

app.use(cors())
app.use(bodyParser.json())
app.use(Rebugit.Handlers().requestHandler())
app.post('/', doStuff)
app.post('/send', doStuff)
app.use(Rebugit.Handlers().errorHandler())
app.use(function onError(err, req, res, next) {
    console.log(err.message, err.stack)
    res.statusCode = 500;
    res.send(err.message)
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
