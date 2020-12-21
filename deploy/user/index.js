const router = require('express').Router()
const { readUserData, saveUserData } = require('./store')
const bodyParser = require('body-parser')

const loggedInOnlyMiddleware = (req, res, next) => {
  const { user } = req
  if (!user) return res.status(401).end()
  return next()
}

router.get('', loggedInOnlyMiddleware, (req, res) => {
  return res.status(200).send(JSON.stringify(req.user))
})

router.get('/config', loggedInOnlyMiddleware, async (req, res) => {
  const { user } = req
  try{
    const data = await readUserData(user)
    res.status(200).json(data)
  } catch (e){
    console.error(e)
    res.status(500).send(e.toString())
  }
})

router.get('/pluginPermissions', async (req, res) => {
  const { user } = req
  /**
   * only using session to store user csp for now
   * in future, if use is logged in, look for **signed** config file, and verify the signature
   */
  const permittedCsp = req.session.permittedCsp || {}
  res.status(200).json(permittedCsp)
})

router.post('/pluginPermissions', bodyParser.json(), async (req, res) => {
  const { user, body } = req
  /**
   * only using session to store user csp for now
   * in future, if use is logged in, **signed** config file, and store in user space
   */
  
  const newPermittedCsp = req.session.permittedCsp || {}
  for (const key in body) {
    newPermittedCsp[key] = body[key]
  }
  req.session.permittedCsp = newPermittedCsp
  res.status(200).json({ ok: true })
})

router.delete('/pluginPermissions/:pluginKey', async (req, res) => {
  const { user, params } = req
  const { pluginKey } = params
  /**
    * only using session to store user csp for now
    * in future, if use is logged in, **signed** config file, and store in user space
    */
  const newPermission = {}
  const permittedCsp = req.session.permittedCsp || {}
  for (const key in permittedCsp) {
    if (!pluginKey !== key) {
      newPermission[key] = permittedCsp[key]
    }
  }
  req.session.permittedCsp = newPermission
  res.status(200).json({ ok: true })
})

router.post('/config', loggedInOnlyMiddleware, bodyParser.json(), async (req, res) => {
  const { user, body } = req
  try {
    await saveUserData(user, body)
    res.status(200).end()
  } catch (e) {
    console.error(e)
    res.status(500).send(e.toString())
  }
})

module.exports = router