const express = require('express')
const path = require('path')
const fs = require('fs')
const datasetsRouter = express.Router()
const { init, getDatasets, getPreview } = require('./query')
const url = require('url')
const qs = require('querystring')

const bodyParser = require('body-parser')
datasetsRouter.use(bodyParser.urlencoded({ extended: false }))
datasetsRouter.use(bodyParser.json())


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



var JSZip = require("jszip");

datasetsRouter.post("/downloadParcellationThemself", (req,res, next) => {


  //ToDo We can add termsOfUse Text file somewhere - will be better
  const termsOfUse = 'Access to the data and metadata provided through HBP Knowledge Graph Data Platform ' +
      '("KG") requires that you cite and acknowledge said data and metadata according to the Terms and' +
      ' Conditions of the Platform.\r\n## Citation requirements are outlined - https://www.humanbrainproject.eu/en/explore-the-brain/search-terms-of-use#citations' +
      '\r\n## Acknowledgement requirements are outlined - https://www.humanbrainproject.eu/en/explore-the-brain/search-terms-of-use#acknowledgements' +
      '\r\n## These outlines are based on the authoritative Terms and Conditions are found - https://www.humanbrainproject.eu/en/explore-the-brain/search-terms-of-use' +
      '\r\n## If you do not accept the Terms & Conditions you are not permitted to access or use the KG to search for, to submit, to post, or to download any materials found there-in.'


  var zip = new JSZip();

  zip.file("credits.txt", req.body['publicationsText'])
  zip.file("Terms of use.txt", termsOfUse)




  //ToDo: Need to download files dynamically. Nii folder should be removed
  if (req.body['niiFiles']) {
    var nii = zip.folder("nifti")
    const filepath = process.env.STORAGE_PATH || path.join(__dirname, 'nii')
    req.body['niiFiles'].forEach(file => {
      nii.file(file['file'], fs.readFileSync(path.join(filepath, file['file'])))
    })
  }

  res.setHeader('Content-Type', 'application/zip')
  zip.generateNodeStream().pipe(res)
});

module.exports = datasetsRouter