const fs = require('fs')
const path = require('path')

const DISABLE_RECEPTOR_PREVIEW = process.env.DISABLE_RECEPTOR_PREVIEW
const DISABLE_JUBRAIN_PMAP = process.env.DISABLE_JUBRAIN_PMAP
const DISABLE_DWM_PMAP = process.env.DISABLE_DWM_PMAP
const HOSTNAME = process.env.HOSTNAME || 'http://localhost:3000'

let previewMap = new Map(),
  previewMapKeySet = new Set()

const readFile = (filename) => new Promise((resolve) => {
  fs.readFile(path.join(__dirname, 'data', filename), 'utf-8', (err, data) => {
    if (err){
      console.log('read file error', err)
      return resolve([])
    }
    resolve(JSON.parse(data))
  })
})

Promise.all([
  DISABLE_RECEPTOR_PREVIEW ? Promise.resolve([]) : readFile('receptorPreview.json'),
  DISABLE_JUBRAIN_PMAP ? Promise.resolve([]) : readFile('pmapJubrainPreview.json'),
  DISABLE_DWM_PMAP ? Promise.resolve([]) : readFile('pmapDWMPreview.json')
])
  .then(arrOfA => arrOfA.reduce((acc, item) => acc.concat(item), []))
  .then(iterable => {
    previewMap = new Map(iterable)
    previewMapKeySet = new Set(previewMap.keys())
  })
  .catch(e => {
    console.error('preview file error', e)
  })

exports.getPreviewFile = ({ datasetName }) => Promise.resolve(
  previewMap.get(datasetName)
    .map(file => {
      return {
        ...file,
        ...(file.url && !/^http/.test(file.url)
          ? {
            url: `${HOSTNAME}/${file.url}`
          }
          : {})
      }
    })
)
exports.getAllPreviewDSNames = () => Array.from(previewMap.keys())
exports.hasPreview = ({ datasetName }) => previewMapKeySet.has(datasetName)