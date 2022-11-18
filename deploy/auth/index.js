const HOST_PATHNAME = process.env.HOST_PATHNAME || ''
const { retry } = require('../../common/util')

let isReady = false

/**
 * using async function. Maybe in the future, we want to introduce async checks
 */
const ready = async () => isReady

const configureAuth = async (app) => {
  console.log('configure Auth')
  const { bootstrapApp: boostrapOidcV2 } = require('./hbp-oidc-v2')
  
  const { initPassportJs, objStoreDb } = require('./util')

  initPassportJs(app)

  await retry(async () => {
    await boostrapOidcV2(app)
  }, { timeout: 1000, retries: 3 })
  isReady = true

  app.get('/logout', (req, res) => {
    if (req.user && req.user.id) objStoreDb.delete(req.user.id)
    req.logout(err => {
      if (!!err) {
        console.log(`err during logout: ${err.toString()}`)
      }
      res.redirect(`${HOST_PATHNAME}/`)
    })
  })
}

module.exports = {
  configureAuth,
  ready
}