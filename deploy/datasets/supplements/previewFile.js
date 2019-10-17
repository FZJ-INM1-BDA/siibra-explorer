const fs = require('fs')
const path = require('path')

const DISABLE_RECEPTOR_PREVIEW = process.env.DISABLE_RECEPTOR_PREVIEW
const DISABLE_JUBRAIN_PMAP = process.env.DISABLE_JUBRAIN_PMAP
const DISABLE_JUBRAIN_PMAP_V17 = process.env.DISABLE_JUBRAIN_PMAP_V17
const DISABLE_DWM_PMAP = process.env.DISABLE_DWM_PMAP
const HOSTNAME = process.env.HOSTNAME || 'http://localhost:3000'

let previewMap = new Map(),
  previewMapKeySet = new Set()

const readFile = (filename) => new Promise((resolve) => {
  fs.readFile(path.join(__dirname, 'data', filename), 'utf-8', (err, data) => {
    if (err){
      console.warn('read file error', err)
      return resolve([])
    }
    resolve(JSON.parse(data))
  })
})

Promise.all([
  DISABLE_RECEPTOR_PREVIEW ? Promise.resolve([]) : readFile('receptorPreview.json'),
  DISABLE_JUBRAIN_PMAP ? Promise.resolve([]) : readFile('pmapJubrainPreview.json'),
  DISABLE_DWM_PMAP ? Promise.resolve([]) : readFile('pmapDWMPreview.json'),
  DISABLE_JUBRAIN_PMAP_V17 ? Promise.resolve([]) : readFile('pmapJuBrainV17Preview.json')
])
  .then(arrOfA => arrOfA.reduce((acc, item) => acc.concat(item), []))
  .then(iterable => {
    previewMap = new Map(iterable)
    previewMapKeySet = new Set(previewMap.keys())
  })
  .catch(e => {
    console.error('preview file error', e)
  })

exports.getPreviewFile = ({ datasetName, templateSelected }) => previewMap.get(datasetName)
  ? Promise.resolve(
      previewMap.get(datasetName)
        .filter(({ templateSpace }) => {
          if (!templateSpace) return true
          if (!templateSelected) return true
          return templateSpace === templateSelected
        })
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
  : Promise.reject(`Preview file cannot be found!`)

exports.getAllPreviewDSNames = () => Array.from(previewMap.keys())
exports.hasPreview = ({ datasetName }) => previewMapKeySet.has(datasetName)