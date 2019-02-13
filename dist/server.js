const express = require('express')
const app = express()
const path = require('path')

app.use(express.static( path.resolve(__dirname, 'aot')))

const PORT = process.env.PORT || 3001

app.listen(PORT, () => console.log(`listening on port ${PORT}`))