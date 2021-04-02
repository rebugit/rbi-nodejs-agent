# Rebugit nodejs agent

## Usage

### Install

`npm install rbi-nodejs-agent`

### Configure

#### Expressjs

Simple express server:

```js
const {RebugitSDK} = require('rbi-nodejs-agent');
const express = require('express')
const app = express()
const port = 9000

const Rebugit = new RebugitSDK({
    apiKey: 'my-api-key',
})

app.use(Rebugit.Handlers().requestHandler())
app.post('/', (req, res) => {
    res.status(200).send({
        hello: 'world'
    })
})
app.use(Rebugit.Handlers().errorHandler({Sentry}))

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
```

#### AWS Lambda

```js
'use strict';

const {RebugitSDK} = require('rbi-nodejs-agent');

const rbi = new RebugitSDK({
    apiKey: 'your-api-key'
})

module.exports.getWeather = rbi.AWSLambda().lambdaHandler(async (event) => {
    const data = JSON.parse(event.body);
    
    return {
        statusCode: 200,
        body: "Hey, Hi Mark!",
        headers: {
            "Access-Control-Allow-Origin": "*"
        },
    };
})

```