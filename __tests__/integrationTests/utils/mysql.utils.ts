import {sha1} from "../../utils";
import {Sequelize} from "sequelize";
import * as typeORM from "typeorm";

const mysql = require('mysql');
const mysql2 = require('mysql2');
const mysql2Promise = require('mysql2/promise');

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

export const queryWithPool = async (...args) => {
    return new Promise((resolve, reject) => {
        const pool = mysql.createPool(connectionInfo);
        pool.query(...args, (error, results, fields) => {
            if (error) {
                return reject(error)
            }

            pool.end((err) => {
                if (err) {
                    return reject(err);
                }
                return resolve(results);
            });
        });
    })
}


export const query2 = async (...args) => {
    return new Promise((resolve, reject) => {
        const connection = mysql2.createConnection(connectionInfo);

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

export const query2WithPromise = async (...args) => {
    const connection = await mysql2Promise.createConnection(connectionInfo);
    const [row, fields] = await connection.query(...args);
    await connection.end()
    return row
}

export const query2WithPool = async (...args) => {
    return new Promise((resolve, reject) => {
        const pool = mysql2.createPool(connectionInfo);
        pool.query(...args, (error, results, fields) => {
            if (error) {
                return reject(error)
            }

            pool.end((err) => {
                if (err) {
                    return reject(err);
                }
                return resolve(results);
            });
        });
    })
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
    await sequelize.close();
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

export const queryWithTypeORM = async (...args: any[]) => {
    // TypeORM use username instead of user
    const newConnectionInfo = {
        ...connectionInfo,
        username: 'root',
        type: 'mysql'
    }
    // @ts-ignore
    const connection = await typeORM.createConnection(newConnectionInfo)

    // @ts-ignore
    const res = await connection.query(...args);
    await connection.close()
    return res
}

export const hashQuery = (...args): string => {
    const s = mysql.format(args[0], args[1]);
    return sha1(s)
}