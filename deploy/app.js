const path = require('path')
const express = require('express')
const app = express()
const session = require('express-session')
const MemoryStore = require('memorystore')(session)

app.disable('x-powered-by')

if (process.env.NODE_ENV !== 'production') {
  app.use(require('cors')())
}

/**
 * load env first, then load other modules
 */

const configureAuth = require('./auth')

const store = new MemoryStore({
  checkPeriod: 86400000
})

const SESSIONSECRET = process.env.SESSIONSECRET || 'this is not really a random session secret'

/**
 * passport application of oidc requires session
 */
app.use(session({
  secret: SESSIONSECRET,
  resave: true,
  saveUninitialized: false,
  store
}))

/**
 * configure Auth
 * async function, but can start server without
 */
configureAuth(app)
  .then(() => console.log('configure auth properly'))
  .catch(e => console.error('configure auth failed', e))

const PUBLIC_PATH = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, 'public')
  : path.join(__dirname, '..', 'dist', 'aot')

app.use(express.static(PUBLIC_PATH))

app.use((req, res, next) => {
  res.set('Content-Type', 'application/json')
  next()
})

const templateRouter = require('./templates')
const nehubaConfigRouter = require('./nehubaConfig')
const datasetRouter = require('./datasets')
const pluginRouter = require('./plugins')
const previewRouter = require('./preview')

app.use('/templates', templateRouter)
app.use('/nehubaConfig', nehubaConfigRouter)
app.use('/datasets', datasetRouter)
app.use('/plugins', pluginRouter)
app.use('/preview', previewRouter)

const catchError = require('./catchError')
app.use(catchError)

module.exports = app