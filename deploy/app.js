const path = require('path')
const express = require('express')
const app = express.Router()
const session = require('express-session')
const MemoryStore = require('memorystore')(session)
const crypto = require('crypto')
const cookieParser = require('cookie-parser')

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

app.use((_req, res, next) => {
  res.setHeader('Referrer-Policy', 'origin-when-cross-origin')
  next()
})

/**
 * show dev banner
 * n.b., must be before express.static() call
 */
app.use(require('./devBanner'))

/**
 * populate nonce token
 */
const indexTemplate = require('fs').readFileSync(
  path.join(PUBLIC_PATH, 'index.html'),
  'utf-8'
)
app.get('/', cookieParser(), (req, res) => {
  const iavError = req.cookies && req.cookies['iav-error']
  
  res.setHeader('Content-Type', 'text/html')

  if (iavError) {
    res.clearCookie('iav-error', { httpOnly: true, sameSite: 'strict' })

    const returnTemplate = indexTemplate
      .replace(/\$\$NONCE\$\$/g, res.locals.nonce)
      .replace('<atlas-viewer>', `<atlas-viewer data-error="${iavError.replace(/"/g, '&quot;')}">`)
    res.status(200).send(returnTemplate)
  } else {
    const returnTemplate = indexTemplate
      .replace(/\$\$NONCE\$\$/g, res.locals.nonce)
    res.status(200).send(returnTemplate)
  }
})

/**
 * User route, for user profile/management
 */
app.use('/user', require('./user'))

/**
 * only use compression for production
 * this allows locally built aot to be served without errors
 */

const { compressionMiddleware } = require('nomiseco')

app.use(compressionMiddleware, express.static(PUBLIC_PATH))

/**
 * saneUrl end points
 */
const saneUrlRouter = require('./saneUrl')
app.use('/saneUrl', saneUrlRouter)

const jsonMiddleware = (req, res, next) => {
  if (!res.get('Content-Type')) res.set('Content-Type', 'application/json')
  next()
}

/**
 * resources endpoints
 */
const templateRouter = require('./templates')
const nehubaConfigRouter = require('./nehubaConfig')
const datasetRouter = require('./datasets')
const pluginRouter = require('./plugins')
const previewRouter = require('./preview')

const setResLocalMiddleWare = routePathname => (req, res, next) => {
  res.locals.routePathname = routePathname
  next()
}

app.use('/templates', setResLocalMiddleWare('templates'), jsonMiddleware, templateRouter)
app.use('/nehubaConfig', jsonMiddleware, nehubaConfigRouter)
app.use('/datasets', jsonMiddleware, datasetRouter)
app.use('/plugins', jsonMiddleware, pluginRouter)
app.use('/preview', jsonMiddleware, previewRouter)

const catchError = require('./catchError')
app.use(catchError)

module.exports = app