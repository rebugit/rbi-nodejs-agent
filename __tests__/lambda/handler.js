const {RebugitSDK} = require('rbi-nodejs-agent');

const rbi = new RebugitSDK({
    apiKey: process.env.REBUGIT_API_KEY,
    collector: {
        collectorBaseUrl: "dev.api.rebugit.com"
    }
})

const handler = rbi.AWSLambda().lambdaHandler(async (event, context) => {
    try {
        const body = JSON.parse(event.body);
        if (body.num < 10) {
            throw new Error("number must be bigger than 10")
        }

        const result = body.num ** 2

        return {
            statusCode: 200,
            body: {
                result
            }
        }
    } catch (e) {
        return {
            statusCode: 500,
            body: e.message,
        }
    }
})

const handlerWithCallback = rbi.AWSLambda().lambdaHandler((event, context, callback) => {
    try {
        const body = JSON.parse(event.body);
        if (body.num < 10) {
            throw new Error("number must be bigger than 10")
        }

        const result = body.num ** 2

        callback(null, {
            statusCode: 200,
            body: {
                result
            }
        })
    } catch (e) {
        callback(null, {
            statusCode: 500,
            body: e.message,
        })
    }
})


module.exports = {
    handler,
    handlerWithCallback
}
