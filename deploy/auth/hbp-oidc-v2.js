const passport = require('passport')
const { configureAuth } = require('./oidc')

const HOSTNAME = process.env.HOSTNAME || 'http://localhost:3000'
const HOST_PATHNAME = process.env.HOST_PATHNAME || ''
const clientId = process.env.HBP_CLIENTID_V2 || 'no hbp id'
const clientSecret = process.env.HBP_CLIENTSECRET_V2 || 'no hbp client secret'
const discoveryUrl = 'https://iam.ebrains.eu/auth/realms/hbp'
const redirectUri = `${HOSTNAME}${HOST_PATHNAME}/hbp-oidc-v2/cb`
const cb = (tokenset, {sub, given_name, family_name, ...rest}, done) => {
  return done(null, {
    id: `hbp-oidc-v2:${sub}`,
    name: `${given_name} ${family_name}`,
    type: `hbp-oidc-v2`,
    tokenset,
    rest
  })
}

module.exports = async (app) => {
  try {
    const { oidcStrategy } = await configureAuth({
      clientId,
      clientSecret,
      discoveryUrl,
      redirectUri,
      cb,
      scope: 'openid email offline_access profile collab.drive',
      clientConfig: {
        redirect_uris: [ redirectUri ],
        response_types: [ 'code' ]
      }
    })
    
    passport.use('hbp-oidc-v2', oidcStrategy)
    app.get('/hbp-oidc-v2/auth', passport.authenticate('hbp-oidc-v2'))
    app.get('/hbp-oidc-v2/cb', passport.authenticate('hbp-oidc-v2', {
      successRedirect: `${HOST_PATHNAME}/`,
      failureRedirect: `${HOST_PATHNAME}/`
    }))
  } catch (e) {
    console.error('oidcv2 auth error', e)
  }
}
