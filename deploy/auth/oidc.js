const { Issuer, Strategy } = require('openid-client')

const defaultCb = (tokenset, {id, ...rest}, done) => {
  return done(null, {
    id: id || Date.now(),
    ...rest
  })
}
try {
  OPENID_CLIENT_TIMEOUT = (process.env.OPENID_CLIENT_TIMEOUT && Number(process.env.OPENID_CLIENT_TIMEOUT)) || 30000
  OPENID_CLIENT_RETRIES = (process.env.OPENID_CLIENT_RETRIES && Number(OPENID_CLIENT_RETRIES)) || 3

  Issuer.defaultHttpOptions = {
    timeout: OPENID_CLIENT_TIMEOUT,
    retry: OPENID_CLIENT_RETRIES
  }
} catch (e) {
  console.warn(`parsing OPENID_CLIENT_TIMEOUT as json error. Got ${OPENID_CLIENT_TIMEOUT}`, e)
}

exports.configureAuth = async ({ discoveryUrl, clientId, clientSecret, redirectUri, clientConfig = {}, cb = defaultCb, scope = 'openid' }) => {
  if (!discoveryUrl) throw new Error('discoveryUrl must be defined!')
  if (!clientId) throw new Error('clientId must be defined!')
  if (!clientSecret) throw new Error('clientSecret must be defined!')
  if (!redirectUri) throw new Error('redirectUri must be defined!')
  
  const issuer = await Issuer.discover(discoveryUrl)

  const client = new issuer.Client({
    client_id: clientId,
    client_secret: clientSecret,
    ...clientConfig
  })

  const oidcStrategy = new Strategy({
    client,
    params: {
      scope
    },
  }, cb)

  return {
    oidcStrategy,
    issuer,
    client
  }
}