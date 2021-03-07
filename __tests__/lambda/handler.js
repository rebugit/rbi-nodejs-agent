const {RebugitSDK} = require('rbi-nodejs-agent');

const rbi = new RebugitSDK({
    apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwcm9qZWN0SWQiOiI5ZTBiOTJlYS1iMmZiLTRlOWYtYWU0Mi0zZThhNWFkMDdlODkiLCJ0ZW5hbnRJZCI6IjY5YTM0YzU4LTQ1ZGMtNDNkZi1hODc2LTY0MzM5NWQ4OTJlMCJ9.E9jarGemO_1-6mpFcCXSRDNsGbN6NOleeU16iguwAfI'
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
