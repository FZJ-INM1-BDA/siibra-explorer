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

const hardCodedMap = new Map([
  ['whs4', '#/a:minds:core:parcellationatlas:v1.0.0:522b368e-49a3-49fa-88d3-0870a307974a/t:minds:core:referencespace:v1.0.0:d5717c4a-0fa1-46e6-918c-b8003069ade8/p:minds:core:parcellationatlas:v1.0.0:ebb923ba-b4d5-4b82-8088-fa9215c2e1fe-v4/@:0.0.0.-W000.._eCwg.2-FUe3._-s_W.2_evlu..kxV..0.0.0..8Yu'],
  ['mebrains', '#/a:juelich:iav:atlas:v1.0.0:monkey/t:minds:core:referencespace:v1.0.0:MEBRAINS_T1.masked/p:minds:core:parcellationatlas:v1.0.0:mebrains-tmp-id/@:0.0.0.-W000.._eCwg.2-FUe3._-s_W.2_evlu..7LIx..0.0.0..1LSm']
])

router.get('/:name', async (req, res) => {
  const { name } = req.params
  const { headers } = req
  
  const redirectFlag = acceptHtmlProg.test(headers['accept'])
    
  try {
    const REAL_HOSTNAME = `${HOSTNAME}${HOST_PATHNAME || ''}/`
    const hardcodedRedir = hardCodedMap.get(name)
    if (hardcodedRedir) {
      if (redirectFlag) res.redirect(`${REAL_HOSTNAME}${hardcodedRedir}`)
      else res.status(200).send(hardcodedRedir)
      return
    }

    const value = await getFile(name)
    if (!value) throw new NotFoundError()
    const json = JSON.parse(value)
    const { queryString } = json


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
