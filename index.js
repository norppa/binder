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

app.get('/api/:site/files', authenticate, async (req, res) => {
    const results = await dao.getFiles(req.params.site)
    res.send(results)
})

app.get('/api/:site/files/:id', authenticate, async (req, res) => {
    const results = await dao.getFileDetails(req.params.id)
    if (!results) {
        res.status(400).send('file ' + req.params.id + ' not found')
    }
    res.send(results)
})

app.delete('/api/:site/files/:id', authenticate, async (req, res) => {
    await dao.deleteFile(req.params.id)
    return res.status(201).send()
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
