const { configureAuth, jwtDecode } = require('./oidc')
const objStoreDb = new Map()

const HOSTNAME = process.env.HOSTNAME || 'http://localhost:3000'
const HOST_PATHNAME = process.env.HOST_PATHNAME || ''
const clientId = process.env.HBP_CLIENTID || 'no hbp id'
const clientSecret = process.env.HBP_CLIENTSECRET || 'no hbp client secret'
const discoveryUrl = 'https://services.humanbrainproject.eu/oidc'
const redirectUri = `${HOSTNAME}${HOST_PATHNAME}/hbp-oidc/cb`

let REFRESH_TOKEN = process.env.REFRESH_TOKEN || null
const CLIENT_NOT_INIT = `Client is not initialised.`
const REFRESH_TOKEN_MISSING = `refresh token is missing`
const REFRESH_ACCESS_TOKEN_MISSING = `access token not defined upon refresh`
const REFRESH_REFRESH_TOKEN_MISSING = `refresh token not defined upon refresh`

let __client
let __publicAccessToken

const refreshToken = async () => {
  if (!__client) throw new Error(CLIENT_NOT_INIT)
  if (!REFRESH_TOKEN) throw new Error(REFRESH_TOKEN_MISSING)
  const tokenset = await __client.refresh(REFRESH_TOKEN)
  const {access_token: accessToken, refresh_token: refreshToken, id_token: idToken} = tokenset
  if (!accessToken) throw new Error(REFRESH_ACCESS_TOKEN_MISSING)
  if (!refreshToken) throw new Error(REFRESH_REFRESH_TOKEN_MISSING)
  if (refreshToken !== REFRESH_TOKEN) {
    REFRESH_TOKEN = refreshToken
  }
  __publicAccessToken = accessToken
  return true
}

const getPublicAccessToken = async () => {
  if (!__client)
    throw new Error(CLIENT_NOT_INIT)
  
  if (!__publicAccessToken) {
    await refreshToken()
  }

  const decoded = jwtDecode(__publicAccessToken)
  const { exp } = decoded

  // refresh token if it is less than 30 minute expiring
  if (!exp || isNaN(exp) || (exp * 1000 - Date.now() < 1e3 * 60 * 30 )) {
    await refreshToken()
  }
  
  return __publicAccessToken
}

const initPassportJs = app => {
  console.log('init passport js')
  const passport = require('passport')
  
  app.use(passport.initialize())
  app.use(passport.session())

  passport.serializeUser((user, done) => {
    const { tokenset, rest } = user
    objStoreDb.set(user.id, user)
    done(null, user.id)
  })

  passport.deserializeUser((id, done) => {
    const user = objStoreDb.get(id)
    if (user) return done(null, user)
    else return done(null, false)
  })
}

module.exports = async () => {

  /**
   * this configuration is required to acquire valid
   * access tokens using refresh token
   * 
   * This is so that datasets can be retrieved when user
   * is not authenticated
   */
  const { client } = await configureAuth({
    clientId,
    clientSecret,
    discoveryUrl,
    redirectUri,
    clientConfig: {
      redirect_uris: [ redirectUri ],
      response_types: [ 'code' ]
    }
  })

  __client = client

  return {
    initPassportJs,
    objStoreDb,
    getPublicAccessToken: async () => await getPublicAccessToken()
  }
}