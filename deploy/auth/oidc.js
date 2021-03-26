const { Issuer, Strategy } = require('openid-client')

const defaultCb = (tokenset, {id, ...rest}, done) => {
  return done(null, {
    id: id || Date.now(),
    ...rest
  })
}

exports.jwtDecode = input => {
  if (!input) throw new Error(`jwtDecode must have an input!`)
  const payload = input.split('.')[1]
  if (!payload) {
    throw new Error(`jwt token does not have enough components`)
  }
  return JSON.parse(Buffer.from(payload, 'base64').toString())
}

exports.configureAuth = async ({ discoveryUrl, clientId, clientSecret, redirectUri, clientConfig = {}, cb = defaultCb, scope = 'openid' }) => {
  if (!discoveryUrl)
    throw new Error('discoveryUrl must be defined!')

  if (!clientId)
    throw new Error('clientId must be defined!')

  if (!clientSecret)
    throw new Error('clientSecret must be defined!')

  if (!redirectUri)
    throw new Error('redirectUri must be defined!')

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