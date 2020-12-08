const fs = require('fs')
const request = require('request')
const URL = require('url')
const path = require('path')
const archiver = require('archiver')
const { getPreviewFile, hasPreview } = require('./supplements/previewFile')
const { constants, init: kgQueryUtilInit, getUserKGRequestParam, filterDatasets, filterDatasetsByRegion } = require('./util')
const ibc = require('./importIBS')
const { returnAdditionalDatasets } = require('../regionalFeatures')

let cachedData = null

const CACHE_DATASET_FILENAME = process.env.CACHE_DATASET_FILENAME || path.join(__dirname, 'cachedKgDataset.json')

fs.readFile(CACHE_DATASET_FILENAME, 'utf-8', (err, data) => {
  /**
   * the file may or may not be present on init
   */
  if (err) {
    console.warn(`read cache failed`, err)
    return
  }

  try {
    cachedData = JSON.parse(data)
  }catch (e) {
    /**
     * parsing saved cached json error
     */
    console.error(e)
  }
})

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
    request(`${KG_QUERY_DATASETS_URL}${releasedOnly ? '&databaseScope=RELEASED' : ''}`, option, (err, resp, body) => {
      if (err) return reject(err)
      if (resp.statusCode >= 400) return reject(resp.statusCode)
      try {
        const json = JSON.parse(body)
        return resolve(json)
      }catch (e) {
        console.warn(`parsing json obj error`, body)
        reject(e)
      }
    })
  })
}

const cacheData = ({ results, ...rest }) => {
  cachedData = results
  otherQueryResult = rest
  fs.writeFile(CACHE_DATASET_FILENAME, JSON.stringify(results), (err) => {
    if (err) console.error('writing cached data fail')
  })
  return cachedData
}

let fetchingPublicDataInProgress = false
let getPublicDsPr

const getPublicDs = async () => {
  console.log(`fetching public ds ...`)

  /**
   * every request to public ds will trigger a refresh pull from master KG (throttled pending on resolved request)
   */
  if (!fetchingPublicDataInProgress) {
    fetchingPublicDataInProgress = true
    getPublicDsPr = fetchDatasetFromKg()
      .then(_ => {
        console.log(`public ds fetched!`)
        fetchingPublicDataInProgress = false
        getPublicDsPr = null
        return _
      })
      .then(cacheData)
  }

  if (cachedData) return Promise.resolve(cachedData)
  if (getPublicDsPr) return getPublicDsPr
  throw `cached Data not yet resolved, neither is get public ds defined`
}


const getDs = ({ user }) => (user
    ? fetchDatasetFromKg({ user }).then(({ results }) => results)
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
        const returnArr = [...acc].splice(existingEntryIdx, 1, {
          ...acc[existingEntryIdx],
          ...curr,
          parcellationRegion: [
            ...(curr['parcellationRegion'] || []),
            ...(acc[existingEntryIdx]['parcellationRegion'] || [])
          ]
        })
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
  'Reference delineations',
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

