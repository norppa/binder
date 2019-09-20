const dbConnection = require('./dbConnection')

const createQuery = ({ id, name, parent, contents, isFolder, removed, created, modified }, site) => {

    if (created) {
        console.log('create is true')
        if (!name) {
            throw new Error('missing name from a create command')
        }
        const queryStr = 'INSERT INTO bdr_files (name, contents, parent, isFolder, fk_site) VALUES (?, ?, ?, ?, ?)'
        const params = [name, contents || '', parent || null, !!isFolder, site]
        return { query: queryStr, params: params }
    }

    if (removed) {
        if (!id) {
            throw new Error('missing id from a delete command')
        }
        return { query: 'DELETE FROM bdr_files WHERE id = ?', params: [id] }
    }

    if (modified) {
        if (!id) {
            throw new Error('missing id from a modify command')
        }
        if (!name && !contents && !parent) {
            throw new Error('missing name/contents/parent from an update command')
        }

        let queryStr = 'UPDATE bdr_files SET'
        let params = []

        if (name) {
            queryStr += ' name = ?'
            params = params.concat(name)
        }
        if (contents) {
            queryStr += name ? ', contents = ?' : ' contents = ?'
            params = params.concat(contents)
        }
        if (parent) {
            queryStr += (name || contents) ? ', parent = ?' : ' parent = ?'
            params = params.concat(parent)
        }
        queryStr += ' WHERE id = ?'
        params = params.concat(id)

        return { query: queryStr, params: params }

    }

    throw new Error('missing created/removed/modified value')
}

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
            connection.query('ROLLBACK')
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
            connection.query('ROLLBACK')
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
            connection.query('ROLLBACK')
            console.error(e)
            throw e
        } finally {
            await connection.release()
            await connection.destroy()
        }
    }

    async updateSite(fileList, site) {
        console.log('updateSite', fileList, site)
        const connection = await dbConnection()
        try {
            await connection.query('START TRANSACTION')
            for (let i = 0; i < fileList.length; i++) {
                const { query, params } = createQuery(fileList[i], site)
                await connection.query(query, params)
            }
            await connection.query('COMMIT')
        } catch (e) {
            connection.query('ROLLBACK')
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
            connection.query('ROLLBACK')
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
            connection.query('ROLLBACK')
            console.error(e)
            throw e
        } finally {
            await connection.release()
            await connection.destroy()
        }
    }

    async getFiles(siteName) {
        const connection = await dbConnection()
        try {
            const queryStr = 'SELECT id, name, isFolder, parent FROM bdr_files WHERE fk_site = ?'
            await connection.query('START TRANSACTION')
            const results = await connection.query(queryStr, siteName)
            await connection.query('COMMIT')
            return results
        } catch (e) {
            connection.query('ROLLBACK')
            console.error(e)
            throw e
        } finally {
            await connection.release()
            await connection.destroy()
        }
    }

    async getFileDetails(fileId) {
        const connection = await dbConnection()
        try {
            const queryStr = 'SELECT name, contents, isFolder, parent FROM bdr_files WHERE id = ?'
            await connection.query('START TRANSACTION')
            const results = await connection.query(queryStr, fileId)
            await connection.query('COMMIT')
            return results[0]
        } catch (e) {
            connection.query('ROLLBACK')
            console.error(e)
            throw e
        } finally {
            await connection.release()
            await connection.destroy()
        }
    }

    async changePassword(site, pwdHash) {
        const connection = await dbConnection()
        try {
            const queryStr = 'UPDATE bdr_sites set pwdHash = ? where name = ?'
            const params = [pwdHash, site]
            await connection.query('START TRANSACTION')
            await connection.query(queryStr, params)
            await connection.query('COMMIT')
        } catch (e) {
            connection.query('ROLLBACK')
            console.error(e)
            throw e
        } finally {
            await connection.release()
            await connection.destroy()
        }
    }

}
