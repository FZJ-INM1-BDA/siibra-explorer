const express = require('express')
const router = express.Router()
const { readUserData, saveUserData } = require('./store')

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

router.post(
  '/config',
  loggedInOnlyMiddleware,
  express.json(),
  async (req, res) => {
    const { user, body } = req
    try {
      await saveUserData(user, body)
      res.status(200).end()
    } catch (e) {
      console.error(e)
      res.status(500).send(e.toString())
    }
  }
)

module.exports = router