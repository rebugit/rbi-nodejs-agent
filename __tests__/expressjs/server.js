const http = require("http");
const {Sequelize} = require('sequelize')
const Sentry = require('@sentry/node')
const cors = require('cors')
// This package must be imported even if there are no methods to require
const {RebugitSDK} = require('../../dist');
const bodyParser = require('body-parser')
const express = require('express')
const app = express()
const port = 9000

const Rebugit = new RebugitSDK({
    apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwcm9qZWN0SWQiOiJmNjEyNTcwZi04MzU0LTQ2MGQtOWJhZi00MzYwNmZlNWFlOTQiLCJ0ZW5hbnRJZCI6IjY5YTM0YzU4LTQ1ZGMtNDNkZi1hODc2LTY0MzM5NWQ4OTJlMCJ9.ZAIk8rh9QX9Pz5tH843hn-uhIkvdxvwt1x1BQuJwKpE',
})

Sentry.init({
    dsn: "https://9cd1dff7aff84daeb2bdf110e9aa8d80@o260622.ingest.sentry.io/5636379",
});

const sequelize = new Sequelize('postgres://postgres:postgres@localhost:5433/postgres') // Example for postgres
const getDataFromDatabase = async () => {
    const res = await sequelize.query('SELECT 1 + 5 * 3 AS result')
    console.log("Outside wrapper", res)
    return res[0][0].result
}

const callExternalAPI = async () => {
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
            reject(err)
        });

        req.end();
    })
}

app.use(cors())
app.use(bodyParser.json())
app.use(Sentry.Handlers.requestHandler());
app.use(Rebugit.Handlers().requestHandler())
app.post('/', async (req, res, next) => {
    const {num} = req.body
    console.log("Received number: ", num)

    const data = await callExternalAPI();
    console.log(data)

    // const moreData = await getDataFromDatabase()
    // console.log(moreData)

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
})

app.use(Rebugit.Handlers().errorHandler({Sentry}))
app.use(Sentry.Handlers.errorHandler());

app.use(function onError(err, req, res, next) {
    // The error id is attached to `res.sentry` to be returned
    // and optionally displayed to the user for support.
    res.statusCode = 500;
    res.send(err.message)
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
