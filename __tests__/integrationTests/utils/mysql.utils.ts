import {sha1} from "../../utils";

const mysql = require('mysql');

export const query = async (...args) => {
    return new Promise((resolve, reject) => {
        const connection = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            database: 'mysql',
            password: 'mysql',
        });

        connection.connect(err => {
            if (err) {
                console.log("Connection", err.message)
                return;
            }
            console.log('connected as id ' + connection.threadId);
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

export const hashQuery = (...args): string => {
    const s = mysql.format(args[0], args[1]);
    return sha1(s)
}