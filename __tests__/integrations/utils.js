const http = require("http");
const https = require("https");
const request = require('request')

const requestWithHttp = (isHttps) => new Promise((resolve, reject) => {
    const options = {
        host: 'jsonplaceholder.typicode.com',
        path: '/todos/1',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    let client;

    if (isHttps){
        client = https
    } else {
        client = http
    }

    const req = client.request(options, (res) => {
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

const requestWithRequest = () => new Promise((resolve, reject) => {
    request('http://jsonplaceholder.typicode.com/todos/1', function (error, response, body) {
        if (error){
            return reject(error)
        }
        resolve(body)
    });
})

const clearEnvironmentVariables = () => {
    for (const key of Object.keys(process.env)) {
        if (key.toUpperCase().startsWith('REBUGIT_')) {
            delete process.env[key];
        }
    }
};

module.exports = {
    requestWithRequest,
    requestWithHttp,
    clearEnvironmentVariables,
}
