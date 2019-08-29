const path = require('path')
const express = require('express')
const app = express()
const session = require('express-session')
const MemoryStore = require('memorystore')(session)
const crypto = require('crypto')

app.disable('x-powered-by')

if (process.env.NODE_ENV !== 'production') {
  app.use(require('cors')())
}

const hash = string => crypto.createHash('sha256').update(string).digest('hex')

app.use((req, _, next) => {
  if (/main\.bundle\.js$/.test(req.originalUrl)){
    const xForwardedFor = req.headers['x-forwarded-for']
    const ip = req.connection.remoteAddress
    console.log({
      type: 'visitorLog',
      method: 'main.bundle.js',
      xForwardedFor: xForwardedFor && xForwardedFor.replace(/\ /g, '').split(',').map(hash),
      ip: hash(ip)
    })
  }
  next()
})

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
 * configure CSP
 */
require('./csp')(app)

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

/**
 * well known path
 */
app.use('/.well-known', express.static(path.join(__dirname, 'well-known')))

/**
 * only use compression for production
 * this allows locally built aot to be served without errors
 */

const { compressionMiddleware } = require('./compression')
app.use(compressionMiddleware, express.static(PUBLIC_PATH))

const jsonMiddleware = (req, res, next) => {
  res.set('Content-Type', 'application/json')
  next()
}

const templateRouter = require('./templates')
const nehubaConfigRouter = require('./nehubaConfig')
const datasetRouter = require('./datasets')
const pluginRouter = require('./plugins')
const previewRouter = require('./preview')

app.use('/templates', jsonMiddleware, templateRouter)
app.use('/nehubaConfig', jsonMiddleware, nehubaConfigRouter)
app.use('/datasets', jsonMiddleware, datasetRouter)
app.use('/plugins', jsonMiddleware, pluginRouter)
app.use('/preview', jsonMiddleware, previewRouter)

const catchError = require('./catchError')
app.use(catchError)

module.exports = app