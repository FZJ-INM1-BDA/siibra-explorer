const express = require('express')
const router = express.Router()
const { FallbackStore: Store, NotFoundError } = require('./store')
const { Store: DepcStore } = require('./depcObjStore')

const store = new Store()
const depStore = new DepcStore()

const { HOSTNAME, HOST_PATHNAME } = process.env

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
  (_req, res) => res.status(410).end()
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
