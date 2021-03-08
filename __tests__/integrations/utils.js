const crypto = require("crypto");
const http = require("http");
const https = require("https");
const request = require('request')
const axios = require("axios");
const {Sequelize} = require("sequelize");
const {Client, Pool} = require('pg')

const REQUEST_BASE_URL = 'jsonplaceholder.typicode.com'
const PATH = 'todos/1'
const RESPONSE_BODY = {
    "completed": false,
    "id": 1,
    "title": "delectus aut autem",
    "userId": 1,
}
const DB_CONNECTION_URI = 'postgres://postgres:postgres@localhost:5433/postgres'
const DB_QUERY = 'SELECT 1 + 5 * $1 AS result'

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

const sequelizeQuery = async (value) => {
    const sequelize = new Sequelize(DB_CONNECTION_URI, {
        logging: console.log,
        dialect: 'postgres'
    })
    const res = await sequelize.query('SELECT 1 + 5 * :multi AS result', {
        replacements: {
            'multi': value
        }
    })
    return res[0][0].result
}

const pgQuery = async (value) => {
    const client = new Client({
        connectionString: DB_CONNECTION_URI
    })
    await client.connect()
    const res = await client.query('SELECT 1 + 5 * $1 AS result', [value])
    await client.end()
    return res.rows[0].result
}

const pgPoolQuery = async (value) => {
    const pool = new Pool({
        connectionString: DB_CONNECTION_URI
    })
    const client = await pool.connect()
    const res = await client.query('SELECT 1 + 5 * $1 AS result', [value])
    await client.release(true)
    return res.rows[0].result
}

const knexQuery = async (value) => {
    const pg = require('knex')({
        client: 'pg',
        connection: DB_CONNECTION_URI,
    });

    const res = await pg.raw('SELECT 1 + 5 * ? AS result', value)
    await pg.destroy()
    return res.rows[0].result
}

const sha1 = (value) => {
    const hash = crypto.createHash('sha1')
    hash.update(value)
    return hash.digest('hex')
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
    pgQuery,
    pgPoolQuery,
    sequelizeQuery,
    sha1,
    knexQuery,
    DB_QUERY,
    REQUEST_BASE_URL,
    PATH,
    RESPONSE_BODY
}
