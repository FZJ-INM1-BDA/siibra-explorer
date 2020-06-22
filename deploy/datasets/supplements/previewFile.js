/**
 * TODO deprecate?
 */

const fs = require('fs')
const path = require('path')
const { reconfigureFlag, reconfigureUrl } = require('../../util/reconfigPrecomputedServer')

const DISABLE_RECEPTOR_PREVIEW = process.env.DISABLE_RECEPTOR_PREVIEW
const DISABLE_JUBRAIN_PMAP = process.env.DISABLE_JUBRAIN_PMAP
const DISABLE_JUBRAIN_PMAP_V17 = process.env.DISABLE_JUBRAIN_PMAP_V17
const DISABLE_JUBRAIN_PMAP_EXTRA = process.env.DISABLE_JUBRAIN_PMAP_EXTRA
const DISABLE_DWM_PMAP = process.env.DISABLE_DWM_PMAP
const HOSTNAME = process.env.HOSTNAME || 'http://localhost:3000'
const HOST_PATHNAME = process.env.HOST_PATHNAME || ''

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
  DISABLE_JUBRAIN_PMAP_V17 ? Promise.resolve([]) : readFile('pmapJuBrainV17Preview.json'),
  DISABLE_JUBRAIN_PMAP_EXTRA ? Promise.resolve([]) : readFile('pmapJuBrainExtraPreview.json')
])
  .then(arrOfA => arrOfA.reduce((acc, item) => acc.concat(item), []))
  .then(iterable => {
    previewMap = new Map(iterable)
    previewMapKeySet = new Set(previewMap.keys())
  })
  .catch(e => {
    console.error('preview file error', e)
  })

const processFile = ({ url, ...rest }) => {
  if (!url) return { ...rest }
  const processedUrl = !/^http/.test(url)
    ? `${HOSTNAME}/${url}`
    : reconfigureFlag
      ? reconfigureUrl(url)
      : url
  return {
    ...rest,
    url: processedUrl
  }
}
  
exports.getPreviewFile = ({ datasetName, templateSelected }) => previewMap.get(datasetName)
  ? Promise.resolve(
      previewMap.get(datasetName)
        .filter(({ templateSpace }) => {
          if (!templateSpace) return true
          if (!templateSelected) return true
          return templateSpace === templateSelected
        })
        .map(processFile)
    )
  : Promise.reject(`Preview file cannot be found!`)

exports.getAllPreviewDSNames = () => Array.from(previewMap.keys())
exports.hasPreview = ({ datasetName }) => previewMapKeySet.has(datasetName)