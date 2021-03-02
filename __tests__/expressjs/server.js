const http = require("http");
const {Sequelize} = require('sequelize')
const Sentry = require('@sentry/node')
const cors = require('cors')
// This package must be imported even if there are no methods to require
const {RebugitSDK} = require('rbi-nodejs-agent');
const {Pool} = require('pg')
const axios = require('axios')
const bodyParser = require('body-parser')
const express = require('express')
const app = express()
const port = 9000

function myCustomIntegrationCallback(env, close, getData, wrap) {
    wrap(module, 'name', function (original) {
        // integration logic
        if (env === 'debug'){
            // inject logic
        }

        // extract logic
    })

    return {
        module: cors,
        name: 'cors'
    }
}

const Rebugit = new RebugitSDK({
    apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwcm9qZWN0SWQiOiI4MGE5OTMyZS1hNTZjLTQ4ZDEtOTU4Mi02M2FiZmY1NzJiMWYiLCJ0ZW5hbnRJZCI6IjY5YTM0YzU4LTQ1ZGMtNDNkZi1hODc2LTY0MzM5NWQ4OTJlMCJ9.W6NFoLtJuofABeu8O6xEPEqBaK8OhMs0xTezYqSZZuQ',
    // customIntegrations: {'myCustomIntegration': myCustomIntegrationCallback}
})

Sentry.init({
    dsn: "https://9cd1dff7aff84daeb2bdf110e9aa8d80@o260622.ingest.sentry.io/5636379",
});


const isSequelize = false
const isAxios = true
const pg = new Pool({
    user: 'postgres',
    database: 'postgres',
    host: 'localhost',
    password: 'postgres',
    port: 5433
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

    await pg.connect()
    const res = await pg.query('SELECT 1 + 5 * $1 AS result', [4])

    return res.rows[0].result
}

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
            }
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
    console.log(data)

    const moreData = await getDataFromDatabase()
    console.log('From db', moreData)

    console.log("Title: ", data.title)

    const length = data.title.length;
    console.log("Title length: ", length)

    if (length - num === 0) {
        return next(new Error("Error: division by 0!!"))
    }

    const magicNumber = 18 / (length - num)

    res.status(200).send({
        magicNumber
    })
}

app.use(cors())
app.use(bodyParser.json())
app.use(Sentry.Handlers.requestHandler());
app.use(Rebugit.Handlers().requestHandler())
app.post('/', doStuff)
app.post('/send', doStuff)

app.use(Rebugit.Handlers().errorHandler({Sentry}))
app.use(Sentry.Handlers.errorHandler());

app.use(function onError(err, req, res, next) {
    // The error id is attached to `res.sentry` to be returned
    // and optionally displayed to the user for support.
    console.log(err.message, err.stack)
    res.statusCode = 500;
    res.send(err.message)
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
