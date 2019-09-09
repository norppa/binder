const dbConnection = require('./dbConnection')

module.exports = class Dao {
    async getAllSites() {
        const connection = await dbConnection()
        try {
            const queryStr = 'SELECT name FROM bdr_sites'
            await connection.query('START TRANSACTION')
            const results = await connection.query(queryStr)
            await connection.query('COMMIT')
            return results
        } catch (e) {
            console.error(e)
            throw e
        } finally {
            await connection.release()
            await connection.destroy()
        }
    }

    async siteExists(siteName) {
        const connection = await dbConnection()
        try {
            const queryStr = 'SELECT name FROM bdr_sites WHERE name = ?'
            const params = [siteName]
            await connection.query('START TRANSACTION')
            const results = await connection.query(queryStr, params)
            await connection.query('COMMIT')
            return results.length > 0
        } catch (e) {
            console.error(e)
            throw e
        } finally {
            await connection.release()
            await connection.destroy()
        }
    }

    async createSite(siteName, pwdHash) {
        const connection = await dbConnection()
        try {
            const queryStr = 'INSERT INTO bdr_sites(name, pwdHash) VALUES(?, ?)'
            const params = [siteName, pwdHash]

            await connection.query('START TRANSACTION')
            const results = await connection.query(queryStr, params)
            await connection.query('COMMIT')

            return results
        } catch (e) {
            console.error(e)
            throw e
        } finally {
            await connection.release()
            await connection.destroy()
        }
    }

    async deleteSite(siteName) {
        const connection = await dbConnection()
        try {
            const query1 = 'DELETE FROM bdr_files WHERE fk_site = ?'
            const query2 = 'DELETE FROM bdr_sites WHERE name = ?'
            const params = [siteName]

            await connection.query('START TRANSACTION')
            await connection.query(query1, params)
            await connection.query(query2, params)
            await connection.query('COMMIT')
        } catch (e) {
            console.error(e)
            throw e
        } finally {
            await connection.release()
            await connection.destroy()
        }
    }

    async getPwdHash(siteName) {
        const connection = await dbConnection()
        try {
            const queryStr = 'SELECT pwdHash FROM bdr_sites WHERE name = ?'
            const params = [siteName]
            await connection.query('START TRANSACTION')
            const results = await connection.query(queryStr, params)
            await connection.query('COMMIT')
            return results[0].pwdHash
        } catch (e) {
            console.error(e)
            throw e
        } finally {
            await connection.release()
            await connection.destroy()
        }
    }


}
