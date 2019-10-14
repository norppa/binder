const dbConnection = require('./dbConnection')

const createUpdateSiteQuery = ({ id, name, parent, contents, isFolder, removed, created, modified }, site) => {

    if (created) {
        console.log('create is true')
        if (!name) {
            throw new Error('missing name from a create command')
        }
        const queryStr = 'INSERT INTO bdr_files (name, contents, parent, isFolder, fk_site) VALUES (?, ?, ?, ?, ?)'
        const params = [name, contents || '', parent || null, !!isFolder, site]
        return { queryStr: queryStr, params: params }
    }

    if (removed) {
        if (!id) {
            throw new Error('missing id from a delete command')
        }
        return { queryStr: 'DELETE FROM bdr_files WHERE id = ?', params: [id] }
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

        return { queryStr, params }

    }

    throw new Error('missing created/removed/modified value')
}

const transaction = async (queryList) => {
    const connection = await dbConnection()
    if (connection === undefined) {
        return undefined
    }
    try {
        await connection.query('START TRANSACTION')
        let results
        queryList.forEach(async (query) => {
            const { queryStr, params } = query
            results = await connection.query(queryStr, params)
        })
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

module.exports = class Dao {
    async getAllSites() {
        const queryList = [
            { queryStr: 'SELECT name FROM bdr_sites', params: undefined }
        ]
        return await transaction(queryList)
    }

    async siteExists(siteName) {
        const queryList = [
            { queryStr: 'SELECT name FROM bdr_sites WHERE name = ?', params: siteName }
        ]
        const results = await transaction(queryList)
        return results.length > 0
    }

    async createSite(siteName, pwdHash) {
        const queryList = [
            { queryStr: 'INSERT INTO bdr_sites(name, pwdHash) VALUES(?, ?)', params: [siteName, pwdHash] }
        ]
        return await transaction(queryList)
    }

    async updateSite(fileList, site) {
        const queryList = fileList.map(file => createUpdateSiteQuery(file, site))
        console.log('queryList', queryList)
        await transaction(queryList)
    }

    async deleteSite(siteName) {
        const queryList = [
            { queryStr: 'DELETE FROM bdr_files WHERE fk_site = ?', params: siteName },
            { queryStr: 'DELETE FROM bdr_sites WHERE name = ?', params: siteName }
        ]
        await transaction(queryList)
    }

    async getPwdHash(siteName) {
        const queryList = [
            { queryStr: 'SELECT pwdHash FROM bdr_sites WHERE name = ?', params: siteName }
        ]
        const results = await transaction(queryList)
        return results[0].pwdHash
    }

    async getFiles(siteName) {
        const queryList = [
            { queryStr: 'SELECT id, name, isFolder, parent FROM bdr_files WHERE fk_site = ?', params: siteName }
        ]
        return await transaction(queryList)
    }

    async getFileDetails(fileId) {
        const queryList = [
            { queryStr: 'SELECT name, contents, isFolder, parent FROM bdr_files WHERE id = ?', params: fileId }
        ]
        const results = await transaction(queryList)
        return results[0]
    }

    async changePassword(site, pwdHash) {
        const queryList = [
            { queryStr: 'UPDATE bdr_sites set pwdHash = ? where name = ?', params: [pwdHash, site] }
        ]
        await transaction(queryList)
    }

}
