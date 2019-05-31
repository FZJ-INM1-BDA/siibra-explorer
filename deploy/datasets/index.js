const express = require('express')
const path = require('path')
const fs = require('fs')
const datasetsRouter = express.Router()
const { init, getDatasets, getPreview } = require('./query')

init().catch(e => {
  console.warn(`dataset init failed`, e)
})

datasetsRouter.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache')
  next()
})

datasetsRouter.use('/spatialSearch', require('./spatialRouter'))

datasetsRouter.get('/templateName/:templateName', (req, res, next) => {
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

datasetsRouter.get('/parcellationName/:parcellationName', (req, res, next) => {
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

datasetsRouter.get('/preview/:datasetName', (req, res, next) => {
  const { datasetName } = req.params
  getPreview({ datasetName })
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
    console.log('reading receptor error', err)
    return
  }
  files.forEach(file => previewFileMap.set(`res/image/receptor/${file}`, path.join(RECEPTOR_PATH, file)))
})

datasetsRouter.get('/previewFile', (req, res) => {
  const { file } = req.query
  const filePath = previewFileMap.get(file)
  if (filePath) {
    fs.createReadStream(filePath).pipe(res)
  } else {
    res.status(404).send()
  }
})

module.exports = datasetsRouter