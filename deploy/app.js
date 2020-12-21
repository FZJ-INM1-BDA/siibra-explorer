const fs = require('fs')
const path = require('path')
const express = require('express')
const app = express.Router()
const session = require('express-session')
const crypto = require('crypto')
const cookieParser = require('cookie-parser')

const { router: regionalFeaturesRouter, regionalFeatureIsReady } = require('./regionalFeatures')
const { router: datasetRouter, ready: datasetRouteIsReady } = require('./datasets')

const LOCAL_CDN_FLAG = !!process.env.PRECOMPUTED_SERVER

if (process.env.NODE_ENV !== 'production') {
  app.use(require('cors')())
}


const DOC_PUBLIC_PATH = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, 'docs')
  : path.join(__dirname, '..', 'site')

app.use('/docs', express.static(DOC_PUBLIC_PATH))
app.use('/quickstart', require('./quickstart'))

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

const { configureAuth, ready: authReady } = require('./auth')


const store = (() => {

  const { USE_DEFAULT_MEMORY_STORE } = process.env
  if (!!USE_DEFAULT_MEMORY_STORE) {
    console.warn(`USE_DEFAULT_MEMORY_STORE is set to true, memleak expected. Do NOT use in prod.`)
    return null
  } 

  const { redisURL } = require('./lruStore')
  if (!!redisURL) {
    const redis = require('redis')
    const RedisStore = require('connect-redis')(session)
    const client = redis.createClient({
      url: redisURL
    })
    return new RedisStore({
      client
    })
  }
  
  /**
   * memorystore (or perhaps lru-cache itself) does not properly close when server shuts
   * this causes problems during tests
   * So when testing app.js, set USE_DEFAULT_MEMORY_STORE to true
   * see app.spec.js
   */
  const MemoryStore = require('memorystore')(session)
  return new MemoryStore({
    checkPeriod: 86400000
  })
  
})() 

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
if (process.env.DISABLE_CSP && process.env.DISABLE_CSP === 'true') {
  console.warn(`DISABLE_CSP is set to true, csp will not be enabled`)
} else {
  require('./csp')(app)
}

/**
 * configure Auth
 * async function, but can start server without
 */

(async () => {
  await configureAuth(app)
  app.use('/user', require('./user'))
})()

const PUBLIC_PATH = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, 'public')
  : path.join(__dirname, '..', 'dist', 'aot')

/**
 * well known path
 */
app.use('/.well-known', express.static(path.join(__dirname, 'well-known')))

if (LOCAL_CDN_FLAG) {
  /*
  * TODO setup local cdn for supported libraries map
  */
  const LOCAL_CDN = process.env.LOCAL_CDN
  const CDN_ARRAY = [
    'https://stackpath.bootstrapcdn.com',
    'https://use.fontawesome.com'
  ]

  let indexFile
  fs.readFile(path.join(PUBLIC_PATH, 'index.html'), 'utf-8', (err, data) => {
    if (err) throw err
    if (!LOCAL_CDN) {
      indexFile = data
      return
    }
    const regexString = CDN_ARRAY.join('|').replace(/\/|\./g, s => `\\${s}`)
    const regex = new RegExp(regexString, 'gm')
    indexFile = data.replace(regex, LOCAL_CDN)
  })
  
  app.get('/', (_req, res) => {
    if (!indexFile) return res.status(404).end()
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    return res.status(200).send(indexFile)
  })
}

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
const { indexTemplate } = require('./constants')
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


app.use('/logo', require('./logo'))

app.get('/ready', async (req, res) => {
  const authIsReady = await authReady()
  const regionalFeatureReady = await regionalFeatureIsReady()
  const datasetReady = await datasetRouteIsReady()
  const allReady = [ 
    authIsReady,
    regionalFeatureReady,
    datasetReady,
    /**
     * add other ready endpoints here
     * call sig is await fn(): boolean
     */
  ].every(f => !!f)
  if (allReady) return res.status(200).end()
  else return res.status(500).end()
})

/**
 * only use compression for production
 * this allows locally built aot to be served without errors
 */
const { compressionMiddleware, setAlwaysOff } = require('nomiseco')
if (LOCAL_CDN_FLAG) setAlwaysOff(true)

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
const atlasesRouter = require('./atlas')
const templateRouter = require('./templates')
const nehubaConfigRouter = require('./nehubaConfig')
const pluginRouter = require('./plugins')
const previewRouter = require('./preview')

const setResLocalMiddleWare = routePathname => (req, res, next) => {
  res.locals.routePathname = routePathname
  next()
}

app.use('/atlases', setResLocalMiddleWare('atlases'), atlasesRouter)
app.use('/templates', setResLocalMiddleWare('templates'), jsonMiddleware, templateRouter)
app.use('/nehubaConfig', jsonMiddleware, nehubaConfigRouter)
app.use('/datasets', jsonMiddleware, datasetRouter)
app.use('/regionalFeatures', jsonMiddleware, regionalFeaturesRouter)
app.use('/plugins', jsonMiddleware, pluginRouter)
app.use('/preview', jsonMiddleware, previewRouter)

const catchError = require('./catchError')
app.use(catchError)

module.exports = app