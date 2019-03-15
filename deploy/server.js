const path = require('path')
const express = require('express')
const app = express()
const session = require('express-session')
const MemoryStore = require('memorystore')(session)


app.disable('x-powered-by')

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
  app.use(require('cors')())
  process.on('unhandledRejection', (err, p) => {
    console.log({err, p})
  })
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

const startServer = async (app) => {
  try{
    await configureAuth(app)
  }catch (e) {
    console.log('error during configureAuth', e)
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
}

startServer(app)