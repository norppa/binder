require('dotenv').config()
const express = require('express')
const cors = require('cors')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const path = require('path')
const app = express()
const port = 3000

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

app.post('/api/:site/login', async (req, res) => {
    const pwdHash = await dao.getPwdHash(req.params.site)
    if (!pwdHash) {
        return res.status(400).send('site /' + req.params.site + ' not found')
    }
    try {
        const pwdCorrect = await bcrypt.compare(req.body.password, pwdHash)
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

app.put('/api/:site/password', authenticate, async (req, res) => {
    try {
        const pwdHash = await bcrypt.hash(req.body.newPassword, 10)
        await dao.changePassword(req.params.site, pwdHash)
        res.status(201).send()
    } catch (e) {
        console.error(e)
        res.status(500).send(e)
    }

})

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

app.delete('/api/:site', authenticate, async (req, res) => {
    try {
        await dao.deleteSite(req.params.site)
        res.status(201).send()
    } catch (e) {
        console.error(e)
        res.status(500).send(e)
    }
})

app.put('/api/:site', authenticate, async (req, res) => {
    try {
        const result = await dao.updateSite(req.body, req.params.site)
        res.status(201).send()
    } catch (e) {
        res.status(400).send(e.message)
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

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/front/dist/index.html'));
})

app.listen(process.env.PORT, () => console.log(`Binder listening on port ${process.env.PORT}!`))
