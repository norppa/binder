const express = require('express')
const app = express()
const port = 3000

const pool = require('./db.js')

app.get('/', (req, res) => res.send('Hello World!'))

app.get('/:site', (req, res) => {
    pool.query('SELECT * FROM bdr_test', (error, result) => {
        console.log(error, result)
    })
    res.send(req.params)
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
