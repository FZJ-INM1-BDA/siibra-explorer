const HOST_PATHNAME = process.env.HOST_PATHNAME || ''
const { retry } = require('../../common/util')

let isReady = false

/**
 * using async function. Maybe in the future, we want to introduce async checks
 */
const ready = async () => isReady

const configureAuth = async (app) => {
  const hbpOidc = require('./hbp-oidc')
  const hbpOidc2 = require('./hbp-oidc-v2')
  
  const obj = await require('./util')()
  const { initPassportJs, objStoreDb } = obj
  initPassportJs(app)

  await retry(() => hbpOidc(app), { timeout: 1000, retries: 3 })
  await retry(() => hbpOidc2(app), { timeout: 1000, retries: 3 })
  isReady = true

  app.get('/logout', (req, res) => {
    if (req.user && req.user.id) objStoreDb.delete(req.user.id)
    req.logout()
    res.redirect(`${HOST_PATHNAME}/`)
  })
}

module.exports = {
  configureAuth,
  ready
}