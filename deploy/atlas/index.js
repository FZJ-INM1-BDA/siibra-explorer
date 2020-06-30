const router = require('express').Router()
const url = require('url')
const { detEncoding } = require('nomiseco')
const { getAllAtlases, getAtlasById, isReady } = require('./query')

const { getTemplate } = require('../templates/query')
const { getHandleErrorFn } = require('../util/streamHandleError')

router.get('/', async (req, res) => {
  const allAtlases = await getAllAtlases()
  const resolvedAtlases = allAtlases.map(v => {
    return {
      '@id': v,
      url: res.locals.routePathname
        ? url.resolve(`${res.locals.routePathname}/`, encodeURIComponent(v))
        : encodeURIComponent(v)
    }
  })
  res.status(200).json(resolvedAtlases)
})

router.get('/ready', (req, res) => {
  if (isReady()) {
    return res.status(200).end()
  } else {
    return res.status(503).end()
  }
})

router.get('/preview', (req, res) => {
  res.status(501).end()
})

router.get('/:atlasId', async (req, res) => {
  const { atlasId } = req.params
  const { templateSpaces, parcellations, ...rest } = await getAtlasById(atlasId)

  const searchParam = new url.URLSearchParams()
  searchParam.set('id', atlasId)
  const lastPathPreview = `preview?${searchParam.toString()}`

  return res.status(200).json({
    ...rest,
    previewUrl: res.locals.routePathname
      ? url.resolve(`${res.locals.routePathname}/`, lastPathPreview)
      : lastPathPreview,
    parcellations: parcellations.map(p => {
      const spSearchParam = new url.URLSearchParams()
      spSearchParam.set('id', p['@id'])
      const parcellationPreview = `preview?${spSearchParam.toString()}`
      return {
        previewUrl: res.locals.routePathname
          ? url.resolve(`${res.locals.routePathname}/`, parcellationPreview)
          : parcellationPreview,
        ...p
      }
    }),
    templateSpaces: templateSpaces.map(tmpl => {
      const lastTemplatePath = `${encodeURIComponent(atlasId)}/template/${encodeURIComponent(tmpl['@id'])}`
      return {
        ...tmpl,
        url: res.locals.routePathname
          ? url.resolve(`${res.locals.routePathname}/`, lastTemplatePath)
          : lastTemplatePath
      }
    })

  })
})

const templateIdToStringMap = new Map([
  ['minds/core/referencespace/v1.0.0/265d32a0-3d84-40a5-926f-bf89f68212b9', 'allenMouse'],
  ['minds/core/referencespace/v1.0.0/d5717c4a-0fa1-46e6-918c-b8003069ade8', 'waxholmRatV2_0'],
  ['minds/core/referencespace/v1.0.0/a1655b99-82f1-420f-a3c2-fe80fd4c8588', 'bigbrain'],
  ['minds/core/referencespace/v1.0.0/dafcffc5-4826-4bf1-8ff6-46b8a31ff8e2', 'MNI152'],
  ['minds/core/referencespace/v1.0.0/7f39f7be-445b-47c0-9791-e971c0b6d992', 'colin']
])

router.get('/:atlasId/template/:templateId', async (req, res) => {
  const { atlasId, templateId } = req.params
  
  const mappedString = templateIdToStringMap.get(templateId)
  if (!mappedString) {
    return res.status(404).end()
  }

  const header = req.get('Accept-Encoding')
  const acceptedEncoding = detEncoding(header)

  if (acceptedEncoding) res.set('Content-Encoding', acceptedEncoding)
  getTemplate({ template: mappedString, acceptedEncoding, returnAsStream: true })
    .pipe(res)
    .on('error', getHandleErrorFn(req, res))
})

router.get('/:atlasId/parcellation/:parcellationId', async (req, res) => {
  res.status(501).end()
})


module.exports = router