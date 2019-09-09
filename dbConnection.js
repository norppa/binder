require('dotenv').config()
const mysql = require('promise-mysql')

const dbConfig = {
    connectionLimit : 10,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    insecureAuth: true
}

module.exports = async () => {
    try {
        let pool
        let connection
        if (pool) {
            connection = pool.getConnection()
        } else {
            pool = await mysql.createPool(dbConfig)
            connection = pool.getConnection()
        }
        return connection
    } catch (exception) {
        throw exception
    }
}
