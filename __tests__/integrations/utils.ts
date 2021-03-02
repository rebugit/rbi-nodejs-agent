import http from "http";
import request from 'request'

export const requestWithHttp = () => new Promise((resolve, reject) => {
    const options = {
        host: 'jsonplaceholder.typicode.com',
        path: '/todos/1',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

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

export const requestWithRequest = () => new Promise((resolve, reject) => {
    request('http://jsonplaceholder.typicode.com', function (error, response, body) {
        if (error){
            return reject(error)
        }
        resolve(body)
    });
})

export const clearEnvironmentVariables = () => {
    for (const key of Object.keys(process.env)) {
        if (key.toUpperCase().startsWith('REBUGIT_')) {
            delete process.env[key];
        }
    }
};
