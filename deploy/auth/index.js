const hbpOidc = require('./hbp-oidc')
const hbpOidc2 = require('./hbp-oidc-v2')
const passport = require('passport')
const objStoreDb = new Map()
const HOST_PATHNAME = process.env.HOST_PATHNAME || ''

module.exports = async (app) => {
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

  await hbpOidc(app)
  await hbpOidc2(app)

  app.get('/user', (req, res) => {
    if (req.user) {
      return res.status(200).send(JSON.stringify(req.user))
    } else {
      return res.status(401).end()
    }
  })

  app.get('/logout', (req, res) => {
    if (req.user && req.user.id) objStoreDb.delete(req.user.id)
    req.logout()
    res.redirect(`${HOST_PATHNAME}/`)
  })
}