const express = require('express')
const cors = require('cors')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const app = express()
const port = 3000

const pool = require('./db.js')

const dbConnection = require('./dbConnection')
const Dao = require('./Dao')
const dao = new Dao()

app.use(cors())
app.use(express.json())
app.use(express.static('front/dist'))

const authenticate = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1]
        const decoded = jwt.verify(token, process.env.SECRET)
        if (decoded.site !== req.params.site) throw new Error('Not Authorized')
        next()
    } catch (err) {
        res.status(401).json({error: 'Not Authorized'})
    }
}

const error = (e, res) => {
    console.error(e)
    return res.status(500).send(e)
}

app.get('/api', async (req, res) => {
    const results = await dao.getAllSites()
    res.send(results.map(result => result.name))
})

app.get('/api/:site', async (req, res) => {
    const results = await dao.siteExists(req.params.site)
    res.send(results)
})

app.post('/api/:site', async (req, res) => {
    const pwdHash = await bcrypt.hash(req.body.password, 10)
    const results = await dao.createSite(req.params.site, pwdHash)
    res.send(results)
})

app.delete('/api/:site', async (req, res) => {
    await dao.deleteSite(req.params.site)
    res.status(201).send()
})

app.post('/api/:site/login', async (req, res) => {
    const pwdHash = await dao.getPwdHash(req.params.site)
    if (!pwdHash) {
        return res.status(400).send('site /' + req.params.site + ' not found')
    }
    try {
        console.log(req.body.password, pwdHash)
        const pwdCorrect = await bcrypt.compare(req.body.password, pwdHash)
        console.log('pwdCorrect', pwdCorrect)
        if (pwdCorrect) {
            const token = jwt.sign({ site: req.params.site }, process.env.SECRET)
            res.send({token})
        } else {
            res.status(401).send('password incorrect')
        }
    } catch (e) {
        console.log(e)
        res.status(500).send(e.message)
    }

})

app.get('/api/:site/files', authenticate, (req, res) => {
    pool.query('SELECT id, name, isFolder, parent FROM bdr_files WHERE fk_site = ?', req.params.site, (err, results) => {
        if (err) return error(err, res)
        res.send(results)
    })
})

// app.put('/api/:site/files', authenticate, async (req, res) => {
//     const files = req.body
//     console.log('foo')
//     let connection = await dbConnection()
//     try {
//         await connection.query('START TRANSACTION')
//         files.forEach(file => {
//             if (!file.id) {
//                 // new file
//
//                 const query = 'INSERT INTO bdr_files (name, isFolder, contents, parent, fk_site) VALUES (?,?,?,?,?)'
//                 const params = [
//                     file.name,
//                     file.isFolder,
//                     file.contents,
//                     file.parent,
//                     req.params.site
//                 ]
//                 const insert = await connection.query(query, params)
//             } else {
//                 // existing file
//                 let query = 'UPDATE bdr_files SET'
//                 let params = []
//                 if (file.name) {
//                     query += ' name = ?'
//                     params = params.concat(file.name)
//                 }
//                 if (file.contents) {
//                     if (query.charAt(query.length - 1) === '?') {
//                         query += ','
//                     }
//                     query += ' contents = ?'
//                     params = params.concat(file.contents)
//                 }
//                 if (file.parent) {
//                     if (query.charAt(query.length - 1) === '?') {
//                         query += ','
//                     }
//                     query += ' parent = ?'
//                     params = params.concat(file.parent)
//                 }
//                 const update = await connection.query(query, params)
//             }
//         })
//         await connection.query('COMMIT')
//     } catch (e) {
//         await connection.query('ROLLBACK')
//         console.log(e)
//         throw e
//     } finally {
//         connection.release()
//         connection.destroy()
//     }
//     res.send('ok')
// })

app.get('/api/:site/files/:id', authenticate, (req, res) => {
    pool.query('SELECT name, contents, isFolder, parent FROM bdr_files WHERE id = ?', req.params.id, (err, results) => {
        if (err) return error(err, res)
        if (results.length === 0) return res.send('not found')
        res.send(results[0])
    })
})

app.post('/api/:site/files', authenticate, (req, res) => {
    console.log(req.body)
    let { name, contents, isFolder, parent } = req.body
    console.log('post /files', name, contents, isFolder, parent)
    if (!name) return res.status(400).send({error: 'missing name', request: req.body })
    if (isFolder && contents) return res.status(400).send({error: 'folders can not have contents', request: req.body })
    if (!isFolder && !contents) {
        contents = ''
    }
    const params = {
        name,
        contents,
        isFolder,
        parent,
        fk_site: req.params.site
    }
    pool.query('INSERT INTO bdr_files SET ?', params, (err, results) => {
        if (err) return error(err, res)
        return res.send({ id: results.insertId})
    })
})

app.put('/api/:site/files/:id', authenticate, (req, res) => {
    const { name, contents, parent } = req.body

    let params = []
    let query = 'UPDATE bdr_files SET'

    if (name) {
        params = params.concat(name)
        if (query.charAt(query.length-1) === '?') {
            query += ','
        }
        query += ' name = ?'
    }
    if (contents) {
        params = params.concat(contents)
        if (query.charAt(query.length-1) === '?') {
            query += ','
        }
        query += ' contents = ?'
    }
    if (parent) {
        params = params.concat(parent)
        if (query.charAt(query.length-1) === '?') {
            query += ','
        }
        query += ' parent = ?'
    }

    params = params.concat(req.params.id)
    query += ' WHERE id = ?'
    console.log('query, params', query, params)

    // const params = [ parent, req.params.id ]
    pool.query(query, params, (err, results) => {
        if (err) return error(err, res)
        return res.send({ id: req.params.id, name, contents, parent })
    })
})

app.delete('/api/:site/files/:id', authenticate, (req, res) => {
    pool.query('DELETE FROM bdr_files WHERE id = ?', req.params.id, (err, results) => {
        if (err) return error(err, res)
        return res.status(204).send()
    })
})





app.listen(port, () => console.log(`Example app listening on port ${port}!`))
