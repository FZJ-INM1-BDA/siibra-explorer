const kgQueryUtil = require('./../auth/util')
const { getCommonSenseDsFilter } = require('./supplements/commonSense')
const { hasPreview } = require('./supplements/previewFile')
const path = require('path')
const fs = require('fs')
const { getIdFromFullId, retry } = require('../../common/util')

let getPublicAccessToken

const getUserKGRequestParam = async ({ user }) => {
  let publicAccessToken
  /**
   * n.b. ACCESS_TOKEN env var is usually only set during dev
   */
  const accessToken = (user && user.tokenset && user.tokenset.access_token) || process.env.ACCESS_TOKEN
  const releasedOnly = !accessToken
  if (!accessToken && getPublicAccessToken) {
    publicAccessToken = await getPublicAccessToken()
  }
  const option = accessToken || publicAccessToken
    ? {
        auth: { bearer: accessToken || publicAccessToken }
      }
    : {}

  return {
    option,
    releasedOnly,
    token: accessToken || publicAccessToken
  }
}

/**
 * Needed by filter by parcellation
 */

const flattenArray = (array) => {
  return array.concat(
    ...array.map(item => item.children && item.children instanceof Array
      ? flattenArray(item.children)
      : [])
  )
}

const readConfigFile = (filename) => new Promise((resolve, reject) => {
  let filepath
  if (process.env.NODE_ENV === 'production') {
    filepath = path.join(__dirname, '..', 'res', filename)
  } else {
    filepath = path.join(__dirname, '..', '..', 'src', 'res', 'ext', filename)
  }
  fs.readFile(filepath, 'utf-8', (err, data) => {
    if (err) reject(err)
    resolve(data)
  })
})

const populateSet = (flattenedRegions, set = new Set()) => {
  if (!(set instanceof Set)) throw `set needs to be an instance of Set`
  if (!(flattenedRegions instanceof Array)) throw `flattenedRegions needs to be an instance of Array`
  for (const region of flattenedRegions) {
    const { name, relatedAreas, fullId } = region
    if (fullId) {
      set.add(
        getIdFromFullId(fullId)
      )
    }
    if (relatedAreas && Array.isArray(relatedAreas)) {
      for (const relatedArea of relatedAreas) {
        const { fullId } = relatedArea
        set.add(
          getIdFromFullId(fullId)
        )
      }
    }
  }
  return set
}

const initPrArray = []

let juBrainSet = new Set(),
  bigbrainCytoSet = new Set()
  shortBundleSet = new Set(),
  longBundleSet = new Set(),
  waxholm1Set = new Set(),
  waxholm2Set = new Set(),
  waxholm3Set = new Set(),
  allen2015Set = new Set(),
  allen2017Set = new Set()

initPrArray.push(
  readConfigFile('bigbrain.json')
    .then(data => JSON.parse(data))
    .then(json => {
      const bigbrainCyto = flattenArray(json.parcellations.find(({ name }) => name === 'Cytoarchitectonic Maps').regions)
      bigbrainCytoSet = populateSet(bigbrainCyto)
    })
    .catch(console.error)
)

initPrArray.push(
  readConfigFile('MNI152.json')
    .then(data => JSON.parse(data))
    .then(json => {
      const longBundle = flattenArray(json.parcellations.find(({ name }) => name === 'Fibre Bundle Atlas - Long Bundle').regions)
      const shortBundle = flattenArray(json.parcellations.find(({ name }) =>  name === 'Fibre Bundle Atlas - Short Bundle').regions)
      const jubrain = flattenArray(json.parcellations.find(({ name }) => 'JuBrain Cytoarchitectonic Atlas' === name).regions)
      longBundleSet = populateSet(longBundle)
      shortBundleSet = populateSet(shortBundle)
      juBrainSet = populateSet(jubrain)
    })
    .catch(console.error)
)

initPrArray.push(
  readConfigFile('waxholmRatV2_0.json')
    .then(data => JSON.parse(data))
    .then(json => {
      const waxholm3 = flattenArray(json.parcellations[0].regions)
      const waxholm2 = flattenArray(json.parcellations[1].regions)
      const waxholm1 = flattenArray(json.parcellations[2].regions)

      waxholm1Set = populateSet(waxholm1)
      waxholm2Set = populateSet(waxholm2)
      waxholm3Set = populateSet(waxholm3)
    })
    .catch(console.error)
)

initPrArray.push(
  readConfigFile('allenMouse.json')
    .then(data => JSON.parse(data))
    .then(json => {
      const flattenedAllen2017 = flattenArray(json.parcellations[0].regions)
      allen2017Set = populateSet(flattenedAllen2017)

      const flattenedAllen2015 = flattenArray(json.parcellations[1].regions)
      allen2015Set = populateSet(flattenedAllen2015)
    })
    .catch(console.error)
)

const datasetRegionExistsInParcellationRegion = async (prs, atlasPrSet = new Set()) => {
  if (!(atlasPrSet instanceof Set)) throw `atlasPrSet needs to be a set!`
  await Promise.all(initPrArray)
  return prs.some(({ fullId }) => atlasPrSet.has(
    getIdFromFullId(fullId)
  ))
}

const templateNameToIdMap = new Map([
  ['Big Brain (Histology)', {
    kg: {
      kgId: 'a1655b99-82f1-420f-a3c2-fe80fd4c8588',
      kgSchema: 'minds/core/referencespace/v1.0.0'
    }
  }],
  ['MNI 152 ICBM 2009c Nonlinear Asymmetric', {
    kg: {
      kgId: 'dafcffc5-4826-4bf1-8ff6-46b8a31ff8e2',
      kgSchema: 'minds/core/referencespace/v1.0.0'
    }
  }],
  ['MNI Colin 27', {
    kg: {
      kgId: '7f39f7be-445b-47c0-9791-e971c0b6d992',
      kgSchema: 'minds/core/referencespace/v1.0.0'
    }
  }]
])

const getKgId = ({ templateName }) => {
  const out = templateNameToIdMap.get(templateName)
  if (!out) return null
  const { kg } = out
  const { kgSchema, kgId } = kg
  return `${kgSchema}/${kgId}`
}


/**
 * NB: if changed, also change ~/docs/advanced/datasets.md
 * @param { templateName } template to be queried 
 */
const datasetBelongsInTemplate = ({ templateName }) => ({ referenceSpaces }) => {
  return referenceSpaces.some(({ name, fullId }) =>
    name === templateName
    || fullId && fullId.includes(getKgId({ templateName })))
}

/**
 * NB: if changed, also change ~/docs/advanced/dataset.md
 * @param {parcellationName, dataset} param0 
 */
const datasetBelongToParcellation = ({ parcellationName = null, dataset = {parcellationAtlas: []} } = {}) => parcellationName === null || dataset.parcellationAtlas.length === 0
  ? true
  : (dataset.parcellationAtlas || []).some(({ name }) => name === parcellationName)

/**
 * NB: if changed, also change ~/docs/advanced/dataset.md
 * @param {*} dataset 
 * @param {*} param1 
 */
const filterDataset = async (dataset = null, { templateName, parcellationName }) => {

  if (/infant/.test(dataset.name)) return false
  
  // check if dataset belongs to template selected
  const flagDatasetBelongToTemplate = datasetBelongsInTemplate({ templateName })(dataset)

  // check that dataset belongs to template selected
  
  // if (dataset.parcellationRegion.length === 0) return false

  let useSet

  // temporary measure
  // TODO ask curaion team re name of jubrain atlas
  let overwriteParcellationName
  switch (parcellationName) {
    case 'Cytoarchitectonic Maps':
      useSet = bigbrainCytoSet
      overwriteParcellationName = 'Jülich Cytoarchitechtonic Brain Atlas (human)'
      break;
    case 'JuBrain Cytoarchitectonic Atlas': 
      useSet = juBrainSet
      overwriteParcellationName = 'Jülich Cytoarchitechtonic Brain Atlas (human)'
      break;
    case 'Fibre Bundle Atlas - Short Bundle':
      useSet = shortBundleSet
      break;
    case 'Fibre Bundle Atlas - Long Bundle':
      useSet = longBundleSet
      break;
    case 'Waxholm Space rat brain atlas v1':
      useSet = waxholm1Set
      break;
    case 'Waxholm Space rat brain atlas v2':
      useSet = waxholm2Set
      break;
    case 'Waxholm Space rat brain atlas v3':
      useSet = waxholm3Set
      break;
    case 'Allen Mouse Common Coordinate Framework v3 2015':
      useSet = allen2015Set
      break;
    case 'Allen Mouse Common Coordinate Framework v3 2017':
      useSet = allen2017Set
      break;
    default:
      useSet = new Set()
  }
  const flagDatasetBelongToParcellation =  datasetBelongToParcellation({ dataset, parcellationName: overwriteParcellationName || parcellationName })
    && await datasetRegionExistsInParcellationRegion(dataset.parcellationRegion, useSet)

  return flagDatasetBelongToTemplate || flagDatasetBelongToParcellation
}

/**
 * NB: if changed, also change ~/docs/advanced/dataset.md
 * @param {*} datasets 
 * @param {*} param1 
 */
const filterDatasets = async (datasets = [], { templateName, parcellationName }) => {

  // filter by commonsense first (species)
  const commonSenseFilteredDatasets = datasets.filter(getCommonSenseDsFilter({ templateName, parcellationName }))
  
  // filter by parcellation name and if region is in parcellation
  const filteredDatasets = []
  for (const dataset of commonSenseFilteredDatasets) {
    if (await filterDataset(dataset, { templateName, parcellationName })) {
      filteredDatasets.push(dataset)
    }
  }

  // append if preview is available
  const filteredDatasetsAppendingPreview = filteredDatasets.map(ds => {
    return {
      ...ds,
      preview: hasPreview({ datasetName: ds.name })
    }
  })

  return filteredDatasetsAppendingPreview
}

const init = async () => {
  if (process.env.ACCESS_TOKEN) {
    if (process.env.NODE_ENV === 'production') console.error(`ACCESS_TOKEN set in production!`)
    else console.warn(`ACCESS_TOKEN environmental variable is set! All queries will be made made with ACCESS_TOKEN!`)
  }
  if (getPublicAccessToken) return
  const { getPublicAccessToken: getPublic } = await kgQueryUtil()
  getPublicAccessToken = getPublic
}

module.exports = {
  getIdFromFullId,
  populateSet,
  init,
  getUserKGRequestParam,
  retry,
  filterDatasets,
  datasetBelongToParcellation,
  datasetRegionExistsInParcellationRegion,
  datasetBelongsInTemplate,
  _getParcellations: async () => {
    await Promise.all(initPrArray)
    return {
      juBrainSet,
      shortBundleSet,
      longBundleSet,
      waxholm1Set,
      waxholm2Set,
      waxholm3Set,
      allen2015Set,
      allen2017Set
    }
  }
}