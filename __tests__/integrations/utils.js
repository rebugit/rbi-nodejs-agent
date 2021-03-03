const http = require("http");
const https = require("https");
const request = require('request')
const axios = require("axios");

const REQUEST_BASE_URL = 'jsonplaceholder.typicode.com'
const PATH = 'todos/1'
const RESPONSE_BODY = {
    "completed": false,
    "id": 1,
    "title": "delectus aut autem",
    "userId": 1,
}

const requestWithHttp = (isHttps = false) => new Promise((resolve, reject) => {
    const options = {
        host: REQUEST_BASE_URL,
        path: `/${PATH}`,
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

const requestWithRequest = (isHttps = false) => new Promise((resolve, reject) => {
    let url;
    if (isHttps){
        url = `https://${REQUEST_BASE_URL}/${PATH}`
    } else {
        url = `http://${REQUEST_BASE_URL}/${PATH}`
    }

    request(url, function (error, response, body) {
        if (error){
            return reject(error)
        }
        resolve(body)
    });
})

const requestWithAxios = async (isHttps = false) => {
    let url;
    if (isHttps){
        url = `https://${REQUEST_BASE_URL}/${PATH}`
    } else {
        url = `http://${REQUEST_BASE_URL}/${PATH}`
    }

    return axios.get(url)
}

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
    requestWithAxios,
    REQUEST_BASE_URL,
    PATH,
    RESPONSE_BODY
}
