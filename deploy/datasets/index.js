const express = require('express')
const path = require('path')
const fs = require('fs')
const datasetsRouter = express.Router()
const { init, getDatasets, getPreview, getDatasetFromId, getDatasetFileAsZip, getTos, hasPreview } = require('./query')
const { retry } = require('./util')
const url = require('url')
const qs = require('querystring')
const { getHandleErrorFn } = require('../util/streamHandleError')

const bodyParser = require('body-parser')

datasetsRouter.use(bodyParser.urlencoded({ extended: false }))
datasetsRouter.use(bodyParser.json())

init()
  .then(() => console.log(`dataset init success`))
  .catch(e => {
    console.warn(`dataset init failed`, e)
    retry(() => init())
  })

const cacheMaxAge24Hr = (_req, res, next) => {
  const oneDay = 24 * 60 * 60
  res.setHeader('Cache-Control', `max-age=${oneDay}`)
  next()
}

const noCacheMiddleWare = (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache')
  next()
}

const getVary = (headers) => (_req, res, next) => {
  if (!headers instanceof Array) {
    console.warn(`getVary arguments needs to be an Array of string`)
    return next()
  }
  res.setHeader('Vary', headers.join(', '))
  next()
}


datasetsRouter.get('/tos', cacheMaxAge24Hr, async (req, res) => {
  const tos = getTos()
  if (tos) {
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
    res.status(200).send(tos)
  } else {
    res.status(404).end()
  }
})

datasetsRouter.use('/spatialSearch', noCacheMiddleWare, require('./spatialRouter'))

datasetsRouter.get('/templateName/:templateName', noCacheMiddleWare, (req, res, next) => {
  const { templateName } = req.params
  const { user } = req
  getDatasets({ templateName, user })
    .then(ds => {
      res.status(200).json(ds)
    })
    .catch(error => {
      next({
        code: 500,
        error,
        trace: 'templateName'
      })
    })
})

datasetsRouter.get('/parcellationName/:parcellationName', noCacheMiddleWare, (req, res, next) => {
  const { parcellationName } = req.params
  const { user } = req
  getDatasets({ parcellationName, user })
    .then(ds => {
      res.status(200).json(ds)
    })
    .catch(error => {
      next({
        code: 500,
        error,
        trace: 'parcellationName'
      })
    })
})

/**
 * It appears that query param are not 
 */
datasetsRouter.get('/preview/:datasetName', getVary(['referer']), cacheMaxAge24Hr, (req, res, next) => {
  const { datasetName } = req.params
  const ref = url.parse(req.headers.referer)
  const { templateSelected, parcellationSelected } = qs.parse(ref.query)
  
  getPreview({ datasetName, templateSelected })
    .then(preview => {
      if (preview) {
        res.status(200).json(preview)
      } else {
        next({
          code: 404,
          trace: 'preview'
        })
      }
    })
    .catch(error => {
      next({
        code: 500,
        error,
        trace: 'preview'
      })
    })
})

const previewFileMap = new Map()

const PUBLIC_PATH = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, '..', 'public')
  : path.join(__dirname, '..', '..', 'dist', 'aot')


const RECEPTOR_PATH = path.join(PUBLIC_PATH, 'res', 'image')
fs.readdir(RECEPTOR_PATH, (err, files) => {
  if (err) {
    console.warn('reading receptor error', err)
    return
  }
  files.forEach(file => previewFileMap.set(`res/image/receptor/${file}`, path.join(RECEPTOR_PATH, file)))
})

datasetsRouter.get('/previewFile', cacheMaxAge24Hr, (req, res) => {
  const { file } = req.query
  const filePath = previewFileMap.get(file)

  // Set content type to give browser a hint for download
  const ext = path.extname(filePath).slice(1)
  const type = express.static.mime.types[ext]

  if (type) res.setHeader('Content-Type', type)

  // even though req.url is modified, req.query is not
  // for now, just serve non encoded image

  res.removeHeader('Content-Encoding')
  
  if (filePath) {
    fs.createReadStream(filePath).pipe(res).on('error', getHandleErrorFn(req, res))
  } else {
    res.status(404).send()
  }
})

const checkKgQuery = (req, res, next) => {
  const { kgSchema } = req.query
  if (kgSchema !== 'minds/core/dataset/v1.0.0') return res.status(400).send('Only kgSchema is required and the only accepted value is minds/core/dataset/v1.0.0')
  else return next()
}

datasetsRouter.get('/hasPreview', cacheMaxAge24Hr, async (req, res) => {
  const { datasetName } = req.query
  if (!datasetName || datasetName === '') return res.status(400).send(`datasetName as query param is required.`)
  return res.status(200).json({
    preview: hasPreview({ datasetName })
  })
})

datasetsRouter.get('/kgInfo', checkKgQuery, cacheMaxAge24Hr, async (req, res) => {
  const { kgId } = req.query
  const { user } = req
  try{
    const stream = await getDatasetFromId({ user, kgId, returnAsStream: true })
    stream.on('error', getHandleErrorFn(req, res)).pipe(res)
  }catch(e){
    getHandleErrorFn(req, res)(e)
  }
})

datasetsRouter.get('/downloadKgFiles', checkKgQuery, async (req, res) => {
  const { kgId } = req.query
  const { user } = req
  try {
    const stream = await getDatasetFileAsZip({ user, kgId })
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="${kgId}.zip"`)
    stream.pipe(res).on('error', getHandleErrorFn(req, res))
  } catch (e) {
    console.warn('datasets/index#downloadKgFiles', e)
    res.status(400).send(e.toString())
  }
})

module.exports = datasetsRouter