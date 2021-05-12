import {sha1} from "../../utils";
import {Sequelize} from "sequelize";

const mysql = require('mysql');

const connectionInfo = {
    host: 'localhost',
    user: 'root',
    database: 'mysql',
    password: 'mysql',
}

export const query = async (...args) => {
    return new Promise((resolve, reject) => {
        const connection = mysql.createConnection(connectionInfo);

        connection.connect(err => {
            console.log("CONNECT CALLED")
            if (err) {
                console.log("Connection", err.message)
                throw err;
            }
        });

        connection.query(...args, (error, results, fields) => {
            if (error) {
                return reject(error)
            }

            connection.end((err) => {
                if (err) {
                    return reject(err);
                }
                return resolve(results);
            });
        });
    });
}

export const queryWithSequelize = async (...args) => {
    const sequelize = new Sequelize(
        connectionInfo.database,
        connectionInfo.user,
        connectionInfo.password,
        {
            logging: console.log,
            dialect: 'mysql'
        }
    )
    // @ts-ignore
    const res = await sequelize.query(...args)
    return res[0]
}

export const queryWithKnex = async (...args: any[]) => {
    const knex = require('knex')({
        client: 'mysql',
        connection: connectionInfo,
    });

    const res = await knex.raw(...args)
    await knex.destroy()

    return res[0]
}

export const hashQuery = (...args): string => {
    const s = mysql.format(args[0], args[1]);
    return sha1(s)
}