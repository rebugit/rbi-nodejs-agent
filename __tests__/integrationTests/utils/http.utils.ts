import * as https from "https";
import * as http from "http";
import superagent from "superagent"
import axios from "axios";
import got from "got";

const REQUEST_BASE_URL = 'localhost'
const PORT = 8080
const PATH = 'todo/1'
const FULL_HTTP_PATH = `http://${REQUEST_BASE_URL}:${PORT}/${PATH}`

export const requestWithHttp = (isHttps = false) => new Promise((resolve, reject) => {
    const options = {
        host: REQUEST_BASE_URL,
        port: PORT,
        path: `/${PATH}`,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    let client;

    if (isHttps) {
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

export const requestWithHttpStreams = async () => new Promise((resolve, reject) => {
    const options = {
        host: REQUEST_BASE_URL,
        port: PORT,
        path: `/${PATH}`,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(options, (res) => {
        console.log(`${options.host} : ${res.statusCode}`);
        res.setEncoding('utf8');
        let output = '';

        res.on("readable", () => {
            let chunk;
            while (null !== (chunk = res.read())) {
                console.log(chunk)
                output += chunk;
            }
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


export const requestWithSuperagent = async () => {
    const response = await superagent('get', FULL_HTTP_PATH)

    return response.body
}

export const requestWithAxios = async (isHttps = false) => {
    const response = await axios.get(FULL_HTTP_PATH)
    return response.data
}

export const requestWithGot = async () => {
    const response = await got(FULL_HTTP_PATH, {responseType: 'json'})
    return response.body
}

export const postRequestWithGot = async () => {
    const response = await got.post(FULL_HTTP_PATH, {
        json: {hello: 'world'},
        responseType: 'json'
    })
    return response.body
}