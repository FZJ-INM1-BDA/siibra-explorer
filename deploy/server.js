const path = require('path')
const express = require('express')
const app = express()

app.disable('x-powered-by')

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
  app.use(require('cors')())
}

const templateRouter = require('./templates')
const nehubaConfigRouter = require('./nehubaConfig')
const datasetRouter = require('./datasets')
const catchError = require('./catchError')

const publicPath = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, 'public')
  : path.join(__dirname, '..', 'dist', 'aot')

app.use('/templates', templateRouter)
app.use('/nehubaConfig', nehubaConfigRouter)
app.use('/datasets', datasetRouter)

app.use(catchError)

app.use(express.static(publicPath))

const PORT = process.env.PORT || 3000

app.listen(PORT, () => console.log(`listening on port ${PORT}`))