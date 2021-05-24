import {Sequelize} from "sequelize";
import crypto from "crypto";
import * as typeORM from "typeorm";

const connectionInfo = {
    host: 'localhost',
    user: 'postgres',
    database: 'postgres',
    password: 'postgres',
    port: 5435
}

export const query = async (...args) => {
    const {Client} = require('pg');
    const client = new Client(connectionInfo)
    await client.connect()
    const res = await client.query(...args)
    await client.end()
    return res
}

export const queryWithPool = async (...args) => {
    const {Pool} = require('pg');
    const pool = new Pool(connectionInfo)
    const client = await pool.connect()
    const res = await client.query(...args)
    await client.release(true)
    return res
}

export const queryWithSequelize = async (...args): Promise<any> => {
    const sequelize = new Sequelize(
        connectionInfo.database,
        connectionInfo.user,
        connectionInfo.password,
        {
            logging: console.log,
            dialect: 'postgres',
            port: connectionInfo.port
        })
    // @ts-ignore
    const res = await sequelize.query(...args)
    await sequelize.close();
    return res[0]
}

export const queryWithKnex = async (...args) => {
    const pg = require('knex')({
        client: 'pg',
        connection: connectionInfo,
    });

    const res = await pg.raw(...args)
    await pg.destroy()
    return res;
}

export const queryWithTypeORM = async (...args: any[]) => {
    // TypeORM use username instead of user
    const newConnectionInfo = {
        ...connectionInfo,
        username: 'postgres',
        type: 'postgres'
    }
    // @ts-ignore
    const connection = await typeORM.createConnection(newConnectionInfo)

    // @ts-ignore
    const res = await connection.query(...args);
    await connection.close()
    return res
}

export const hashQuery = (...args) => {
    const newArgs = [...args]
    let s = newArgs[0]

    // In the case of Sequelize
    if (newArgs[1].hasOwnProperty('replacements')) {
        const replacements = args[1].replacements
        const keys = Object.keys(replacements);
        for (const key of keys) {
            s = s.replace(`:${key}`, replacements[key])
        }
    }

    // If Knex named bindings
    if (Object.prototype.toString.call(newArgs[1]).slice(8, -1) === 'Object') {
        const replacements = args[1]
        const keys = Object.keys(replacements);
        for (const key of keys) {
            s = s.replace(`:${key}`, replacements[key])
        }
    }

    s = s.replace('$1', newArgs[1]);


    const hash = crypto.createHash('sha1')
    hash.update(s)
    return hash.digest('hex')
}