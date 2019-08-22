const express = require('express')
const cors = require('cors')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const app = express()
const port = 3000

const pool = require('./db.js')

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

app.get('/api', (req, res) => {
    pool.query('SELECT name FROM bdr_sites', (err, results) => {
        if (err) return error(err, res)
        res.send(results.map(result => result.name))
    })
})

app.get('/api/:site', (req, res) => {
    pool.query('SELECT name FROM bdr_sites WHERE name = ?', req.params.site, (err, results) => {
        if (err) return error(err, res)
        res.send(results.length > 0)
    })
})

app.post('/api/:site/create', (req, res) => {
    const saltRounds = 10
    const password = req.body.password
    bcrypt.hash(password, saltRounds, (error, hash) => {
        if (error) {
            console.error(error)
            res.status(500).send(error)
            return
        }
        const site = { name: req.params.site, pwd_hash: hash }
        console.log('site', site)
        pool.query('INSERT INTO bdr_sites SET ?', site, (error, result) => {
            if (error) {
                console.error(error)
                res.status(500).send(error)
                return
            }
            res.send(result)
        })
    })
})

app.post('/api/:site/login', (req, res) => {
    pool.query('SELECT pwd_hash FROM bdr_sites WHERE name = ?', req.params.site, (error, result) => {
        if (error) {
            console.error(error)
            res.status(500).send(error)
            return
        }
        if (result.length === 0) {
            return res.send('site not found')
        }
        bcrypt.compare(req.body.password, result[0].pwd_hash, (error, result) => {
            if (error) {
                console.error(error)
                res.status(500).send(error)
                return
            }
            if (result === true) {
                const token = jwt.sign({ site: req.params.site }, process.env.SECRET)
                res.send({token})
            } else {
                res.status(401).send('password incorrect')
            }
        })
    })
})

app.get('/api/:site/files', authenticate, (req, res) => {
    pool.query('SELECT id, name, path FROM bdr_files WHERE fk_site = ?', req.params.site, (err, results) => {
        if (err) return error(err, res)
        res.send(results)
    })
})

app.get('/api/:site/files/:id', authenticate, (req, res) => {
    pool.query('SELECT content FROM bdr_files WHERE id = ?', req.params.id, (err, results) => {
        if (err) return error(err, res)
        if (results.length === 0) return res.send('not found')
        const result = results[0].content
        res.send(result)
    })
})

app.post('/api/:site/files', authenticate, (req, res) => {
    const { name, contents } = req.body
    if (!name || !contents) return res.status(400).send('missing file name or contents')
    const file = {
        fk_site: req.params.site,
        name: req.body.name,
        content: req.body.contents
    }
    pool.query('INSERT INTO bdr_files SET ?', file, (err, results) => {
        if (err) return error(err, res)
        console.log(results)
        return res.send({...file, id: results.insertId})
    })
})

app.put('/api/:site/files/:id', authenticate, (req, res) => {
    const { name, contents } = req.body
    if (!name || !contents) return res.status(400).send('missing file name or contents')
    const values = [ req.body.name, req.body.contents, req.params.id ]
    pool.query('UPDATE bdr_files SET name = ?, content = ? WHERE id = ?', values, (err, results) => {
        if (err) return error(err, res)
        return res.send({ id: req.params.id, name: req.body.name, content: req.body.contents })
    })
})

app.delete('/api/:site/files/:id', authenticate, (req, res) => {
    pool.query('DELETE FROM bdr_files WHERE id = ?', req.params.id, (err, results) => {
        if (err) return error(err, res)
        return res.status(204).send()
    })
})





app.listen(port, () => console.log(`Example app listening on port ${port}!`))
