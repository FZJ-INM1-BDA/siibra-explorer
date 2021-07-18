const fs = require('fs')
const request = require('request')
const URL = require('url')
const path = require('path')
const archiver = require('archiver')
const { getPreviewFile, hasPreview } = require('./supplements/previewFile')
const { constants, init: kgQueryUtilInit, getUserKGRequestParam, filterDatasets, filterDatasetsByRegion } = require('./util')
const ibc = require('./importIBS')
const { returnAdditionalDatasets } = require('../regionalFeatures')
const lruStore = require('../lruStore')

const IAV_DS_CACHE_KEY = 'IAV_DS_CACHE_KEY'
const IAV_DS_TIMESTAMP_KEY = 'IAV_DS_TIMESTAMP_KEY'
const IAV_DS_REFRESH_TIMESTAMP_KEY = 'IAV_DS_REFRESH_TIMESTAMP_KEY'

const { KG_ROOT, KG_SEARCH_VOCAB } = constants

const KG_DATASET_SEARCH_QUERY_NAME = process.env.KG_DATASET_SEARCH_QUERY_NAME || 'interactiveViewerKgQuery-v1_0'
const KG_DATASET_SEARCH_PATH = process.env.KG_DATASET_SEARCH_PATH || '/minds/core/dataset/v1.0.0'

const kgDatasetSearchFullString = `${KG_DATASET_SEARCH_PATH}/${KG_DATASET_SEARCH_QUERY_NAME}`

const KG_PARAM = {
  size: process.env.KG_SEARCH_SIZE || '1000',
  vocab: KG_SEARCH_VOCAB
}

const KG_QUERY_DATASETS_URL = new URL.URL(`${KG_ROOT}${kgDatasetSearchFullString}/instances`)
for (let key in KG_PARAM) {
  KG_QUERY_DATASETS_URL.searchParams.set(key, KG_PARAM[key])
}

const getKgQuerySingleDatasetUrl = ({ kgId }) => {
  const _newUrl = new URL.URL(KG_QUERY_DATASETS_URL)
  _newUrl.pathname = `${_newUrl.pathname}/${kgId}`
  return _newUrl
}

const fetchDatasetFromKg = async ({ user } = {}) => {

  const { releasedOnly, option } = await getUserKGRequestParam({ user })
  return await new Promise((resolve, reject) => {
    request(
      `${KG_QUERY_DATASETS_URL}${releasedOnly ? '&databaseScope=RELEASED' : ''}`,
      {
        timeout: 60 * 1000,
        ...option
      },
      (err, resp, body) => {
        if (err) return reject(err)
        if (resp.statusCode >= 400) return reject(resp.statusCode)
        resolve(body)
      })
  })
}

const refreshCache = async () => {
  await lruStore._initPr
  const { store } = lruStore
  store.set(IAV_DS_REFRESH_TIMESTAMP_KEY, new Date().toString())
  const text = await fetchDatasetFromKg()
  await store.set(IAV_DS_CACHE_KEY, text)
  await store.set(IAV_DS_REFRESH_TIMESTAMP_KEY, null)
  await store.set(IAV_DS_TIMESTAMP_KEY, new Date().toString())
}

const getPublicDs = async () => {
  console.log(`fetching public ds ...`)
  
  await lruStore._initPr
  const { store } = lruStore

  let cachedData = await store.get(IAV_DS_CACHE_KEY)
  if (!cachedData) {
    await refreshCache()
    cachedData = await store.get(IAV_DS_CACHE_KEY)
  }

  const timestamp = await store.get(IAV_DS_TIMESTAMP_KEY)
  const refreshTimestamp = await store.get(IAV_DS_REFRESH_TIMESTAMP_KEY)
  
  if (
    new Date() - new Date(timestamp) > 1e3 * 60 * 30
  ) {
    if (
      !refreshTimestamp ||
      new Date() - new Date(refreshTimestamp) > 1e3 * 60 * 5
    ) {
      refreshCache()
    }
  }
  if (cachedData) {
    const { results } = JSON.parse(cachedData)
    return Promise.resolve(results)
  }
  throw new Error(`cacheData not defined!`)
}

/**
 * force get only public ds
 * getting individual ds is too slow
 */
const getDs = ({ user }) => (false && user
    ? fetchDatasetFromKg({ user })
        .then(text => JSON.parse(text))
        .then(({ results }) => results)
    : getPublicDs()
  ).then(async datasets => {
    
    /**
     * populate the manually inserted dataset first
     * this allows inserted dataset to overwrite the KG dataset (if needed)
     */
    return [
      ...(await returnAdditionalDatasets()),
      ...datasets,
    ]
    .reduce((acc, curr) => {
      /**
       * remove duplicates
       */
      const existingEntryIdx = acc.findIndex(v => v['fullId'] === curr['fullId'])
      if (existingEntryIdx >= 0) {
        const itemToReturn = {
          ...acc[existingEntryIdx],
          ...curr,
          parcellationRegion: [
            ...(curr['parcellationRegion'] || []),
            ...(acc[existingEntryIdx]['parcellationRegion'] || [])
          ]
        }
        const returnArr = [...acc]
        returnArr.splice(existingEntryIdx, 1, itemToReturn)
        return returnArr
      }
      else return acc.concat(curr)
    }, [])
  })

const getExternalSchemaDatasets = (kgId, kgSchema) => {
  if (kgSchema === ibc.IBC_SCHEMA) {
    return ibc.getIbcDatasetByFileName(kgId)
  }
}

/**
 * on init, populate the cached data
 */
const init = async () => {
  await kgQueryUtilInit()
  return await getPublicDs()
}

const dsNamesToExclude = [
  'DiFuMo atlas',
  'Whole-brain parcellation',
  'Probabilistic cytoarchitectonic map',
  'Automated Anatomical Labeling (AAL1) atlas',
  'Maximum probability map',
  'Interpolated 3D map',
  'Corrected 3-D reconstruction and surface parcellation',
  'Probability map',
  'Probabilistic map',
  // 'Reference delineations',
  'Atlas of the short fiber bundles ',
  'Desikan-Killiany Atlas',
  'GapMap',
  'Cytoarchitectonic areas',
  'Co-activation based parcellation',
  'CEREBRUM-7T',
  'Filter Activations of Convolutional Neuronal Networks'
]

const getDatasetsByRegion = async ({ regionId, user }) => {
  /**
   * potentially add other sources of datasets
   */
  const kgDatasets = await getDs({ user })
  const excludedDatasets = kgDatasets.filter(({ name }) => {
    if (!name) return true
    return !dsNamesToExclude.some(n => name.indexOf(n) === 0)
  })
  return filterDatasetsByRegion([
    ...excludedDatasets,
    /**
     * other datasets, such ibc
     */
    ...ibc.getIBCData(),
  ], regionId)
}

const getDatasets = ({ templateName, parcellationName, user }) => {
  // Get Local datasets
  const localDatasets = [
    ...ibc.getIBCData(),
    // ... Add more dataset sources here
  ]

  // Get all datasets and merge local ones
  return getDs({ user })
    .then(json => {
      json = [...json, ...localDatasets]
      return filterDatasets(json, { templateName, parcellationName })
    })
}

const getPreview = ({ datasetName, templateSelected }) => getPreviewFile({ datasetName, templateSelected })

const getDatasetFromId = async ({ user, kgId, returnAsStream = false }) => {
  const { option, releasedOnly } = await getUserKGRequestParam({ user })
  const _url = getKgQuerySingleDatasetUrl({ kgId })
  if (releasedOnly) _url.searchParams.set('databaseScope', 'RELEASED')
  if (returnAsStream) return request(_url, option)
  else return new Promise((resolve, reject) => {
    request(_url, option, (err, resp, body) => {
      if (err) return reject(err)
      if (resp.statusCode >= 400) return reject(resp.statusCode)
      return resolve(JSON.parse(body))
    })
  })
}

const renderPublication = ({ name, cite, doi }) => `${name}
  ${cite}
  DOI: ${doi}
`

const prepareDatasetMetadata = ({ name, description, kgReference, contributors, publications }) => {

  return `${name}

${description}

${publications.map(renderPublication).join('\n')}
`
}

let kgtos

fs.readFile(path.join(__dirname, 'kgtos.md') , 'utf-8', (err, data) => {
  if (err) console.warn(`reading kgtos Error`, err)
  kgtos = data
})

const getTos = () => kgtos

const getLicense = ({ licenseInfo }) => licenseInfo.map(({ name, url }) => `${name}
<${url}>
`).join('\n')

const getDatasetFileAsZip = async ({ user, kgId } = {}) => {
  if (!kgId) {
    throw new Error('kgId must be defined')
  }

  const dataset = await getDatasetFromId({ user, kgId })
  const { files, name: datasetName } = dataset
  const zip = archiver('zip')

  /**
   * append citation information
   */
  zip.append(prepareDatasetMetadata(dataset), {
    name: `README.txt`
  })

  /**
   * append kg citation policy
   */

  zip.append(getLicense(dataset), {
    name: `LICENSE.md`
  })

  /**
   * append all of the files
   */
  for (let file of files) {
    const { name, absolutePath } = file
    zip.append(request(absolutePath), {
      name: path.join(datasetName, name)
    })
  }

  zip.finalize()

  return zip
}

module.exports = {
  getDatasetFromId,
  getDatasetFileAsZip,
  init,
  getDatasets,
  getPreview,
  hasPreview,
  getTos,
  getExternalSchemaDatasets,
  getDatasetsByRegion,
}

