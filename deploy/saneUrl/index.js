const express = require('express')
const router = express.Router()
const { GitlabSnippetStore: Store, NotFoundError } = require('./store')
const { Store: DepcStore } = require('./depcObjStore')
const RateLimit = require('express-rate-limit')
const RedisStore = require('rate-limit-redis')
const { redisURL } = require('../lruStore')
const { ProxyStore, NotExactlyPromiseAny } = require('./util')

const store = new Store()
const depStore = new DepcStore()

const proxyStore = new ProxyStore(store)

const {
  HOSTNAME,
  HOST_PATHNAME,
  DISABLE_LIMITER,
} = process.env

const limiter = new RateLimit({
  windowMs: 1e3 * 5,
  max: 5,
  ...( redisURL ? { store: new RedisStore({ redisURL }) } : {} )
})
const passthrough = (_, __, next) => next()

const acceptHtmlProg = /text\/html/i

const REAL_HOSTNAME = `${HOSTNAME}${HOST_PATHNAME || ''}/`

router.get('/:name', async (req, res) => {
  const { name } = req.params
  const { headers } = req
  
  const redirectFlag = acceptHtmlProg.test(headers['accept'])
    
  try {

    const json = await NotExactlyPromiseAny([
      ProxyStore.StaticGet(depStore, req, name),
      proxyStore.get(req, name)
    ])

    const { queryString, hashPath } = json

    if (redirectFlag) {
      if (queryString) return res.redirect(`${REAL_HOSTNAME}?${queryString}`)
      if (hashPath) return res.redirect(`${REAL_HOSTNAME}#${hashPath}`)
    } else {
      return res.status(200).send(json)
    }
  } catch (e) {
    const notFoundFlag = e instanceof NotFoundError
    if (redirectFlag) {

      const REAL_HOSTNAME = `${HOSTNAME}${HOST_PATHNAME || ''}/`

      res.cookie(
        'iav-error', 
        notFoundFlag ? `${name} 
        
        not found` : `error while fetching ${name}.`,
        {
          httpOnly: true,
          sameSite: "strict",
          maxAge: 1e3 * 30
        }
      )
      return res.redirect(REAL_HOSTNAME)
    }
    if (notFoundFlag) return res.status(404).end()
    else return res.status(500).send(e.toString())
  }
})

router.post('/:name',
  DISABLE_LIMITER ? passthrough : limiter,
  express.json(),
  async (req, res) => {
    if (req.headers['x-noop']) return res.status(200).end()
    const { name } = req.params
    try {
      await proxyStore.set(req, name, req.body)
      res.status(201).end()
    } catch (e) {
      console.log(e.body)
      res.status(500).send(e.toString())
    }
  }
)

router.use((_, res) => {
  res.status(405).send('Not implemneted')
})

const ready = async () => {
  return await store.healthCheck()
}

module.exports = {
  router,
  ready,
}
