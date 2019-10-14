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
    console.log('start')
    try {
        let pool, connection
        if (!pool) {
            pool = await mysql.createPool(dbConfig)
        }
        connection = await pool.getConnection()
        return connection
    } catch (error) {
        console.error('Error connecting to database!\n', error)
        return undefined
    }
}
