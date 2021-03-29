const express = require('express')
const router = express.Router()
const RateLimit = require('express-rate-limit')
const RedisStore = require('rate-limit-redis')
const { Store, NotFoundError } = require('./store')
const { Store: DepcStore } = require('./depcObjStore')
const { readUserData, saveUserData } = require('../user/store')

const store = new Store()
const depStore = new DepcStore()

const { 
  REDIS_PROTO,
  REDIS_ADDR,
  REDIS_PORT,

  REDIS_RATE_LIMITING_DB_EPHEMERAL_PORT_6379_TCP_PROTO,
  REDIS_RATE_LIMITING_DB_EPHEMERAL_PORT_6379_TCP_ADDR,
  REDIS_RATE_LIMITING_DB_EPHEMERAL_PORT_6379_TCP_PORT,

  REDIS_USERNAME,
  REDIS_PASSWORD,

  HOSTNAME,
  HOST_PATHNAME,
  DISABLE_LIMITER,
} = process.env

const redisProto = REDIS_PROTO || REDIS_RATE_LIMITING_DB_EPHEMERAL_PORT_6379_TCP_PROTO || 'redis'
const redisAddr = REDIS_ADDR || REDIS_RATE_LIMITING_DB_EPHEMERAL_PORT_6379_TCP_ADDR || null
const redisPort = REDIS_PORT || REDIS_RATE_LIMITING_DB_EPHEMERAL_PORT_6379_TCP_PORT || 6379

/**
 * nb this way to set username and pswd can be risky, but given that site adnimistrator sets the username and pswd via env var
 * it should not be a security concern
 */
const userPass = (REDIS_USERNAME || REDIS_PASSWORD) && `${REDIS_USERNAME || ''}:${REDIS_PASSWORD || ''}@`

const redisURL = redisAddr && `${redisProto}://${userPass || ''}${redisAddr}:${redisPort}`

const limiter = new RateLimit({
  windowMs: 1e3 * 5,
  max: 5,
  ...( redisURL ? { store: new RedisStore({ redisURL }) } : {} )
})

const passthrough = (_, __, next) => next()

const acceptHtmlProg = /text\/html/i

const getFileFromStore = async (name, store) => {
  try {
    const value = await store.get(name)
    const json = JSON.parse(value)
    const { expiry } = json
    if ( expiry && ((Date.now() - expiry) > 0) ) {
      return null
    }
  
    return value
  } catch (e) {
    if (e instanceof NotFoundError) {
      return null
    }
    throw e
  }
}

const getFile = async name => {
  const value = await getFileFromStore(name, depStore)
    || await getFileFromStore(name, store)

  return value
}

router.get('/:name', async (req, res) => {
  const { name } = req.params
  const { headers } = req
  
  const redirectFlag = acceptHtmlProg.test(headers['accept'])
    
  try {
    const value = await getFile(name)
    if (!value) throw new NotFoundError()
    const json = JSON.parse(value)
    const { queryString } = json

    const REAL_HOSTNAME = `${HOSTNAME}${HOST_PATHNAME || ''}/`

    if (redirectFlag) res.redirect(`${REAL_HOSTNAME}?${queryString}`)
    else res.status(200).send(value)

  } catch (e) {
    if (redirectFlag) {

      const REAL_HOSTNAME = `${HOSTNAME}${HOST_PATHNAME || ''}/`

      res.cookie(
        'iav-error', 
        e instanceof NotFoundError ? `${name} 
        
        not found` : `error while fetching ${name}.`,
        {
          httpOnly: true,
          sameSite: "strict",
          maxAge: 1e3 * 30
        }
      )
      return res.redirect(REAL_HOSTNAME)
    }
    if (e instanceof NotFoundError) return res.status(404).end()
    else return res.status(500).send(e.toString())
  }
})

router.post('/:name',
  DISABLE_LIMITER ? passthrough : limiter,
  async (req, res, next) => {
    const { name } = req.params
    try {
      const exist = await getFile(name)
      if (!exist) throw new NotFoundError()
      return res.status(409).send(`filename already exists`)
    } catch (e) {
      if (e instanceof NotFoundError) return next()
      else return res.status(500).send(e)
    }
  },
  express.json(),
  async (req, res) => {
    const { name } = req.params
    const { body, user } = req
    
    try {
      const payload = {
        ...body,
        userId: user && user.id,
        expiry: !user && (Date.now() + 1e3 * 60 * 60 * 72)
      }

      await store.set(name, JSON.stringify(payload))
      res.status(200).end()

      try {
        if (!user) return
        const { savedCustomLinks = [], ...rest } = await readUserData(user)
        await saveUserData(user, {
          ...rest,
          savedCustomLinks: [
            ...savedCustomLinks,
            name
          ]
        })
      } catch (e) {
        console.error(`reading/writing user data error ${user && user.id}, ${name}`, e)
      }
    } catch (e) {
      console.error(`saneUrl /POST error`, e)
      const { statusCode, statusMessage } = e
      res.status(statusCode || 500).send(statusMessage || 'Error encountered.')
    }
  }
)

router.use((_, res) => {
  res.status(405).send('Not implemneted')
})

module.exports = router
