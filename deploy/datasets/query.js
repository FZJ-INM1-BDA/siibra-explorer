const fs = require('fs')
const request = require('request')
const URL = require('url')
const path = require('path')
const archiver = require('archiver')
const { commonSenseDsFilter } = require('./supplements/commonSense')
const { getPreviewFile, hasPreview } = require('./supplements/previewFile')

const kgQueryUtil = require('./../auth/util')

let cachedData = null
let otherQueryResult = null

const KG_ROOT = process.env.KG_ROOT || `https://kg.humanbrainproject.org`
const KG_PATH = process.env.KG_PATH || `/query/minds/core/dataset/v1.0.0/interactiveViewerKgQuery-v0_1`
const KG_PARAM = {
  size: process.env.KG_SEARCH_SIZE || '1000',
  vocab: process.env.KG_SEARCH_VOCAB || 'https://schema.hbp.eu/myQuery/'
}

const KG_QUERY_DATASETS_URL = new URL.URL(`${KG_ROOT}${KG_PATH}/instances`)
for (let key in KG_PARAM) {
  KG_QUERY_DATASETS_URL.searchParams.set(key, KG_PARAM[key])
}

const getKgQuerySingleDatasetUrl = ({ kgId }) => {
  const _newUrl = new URL.URL(KG_QUERY_DATASETS_URL)
  _newUrl.pathname = `${KG_PATH}/instances/${kgId}`
  return _newUrl
}

const timeout = process.env.TIMEOUT || 5000
const STORAGE_PATH = process.env.STORAGE_PATH || path.join(__dirname, 'data')

let getPublicAccessToken

const fetchDatasetFromKg = async ({ user } = {}) => {

  const { releasedOnly, option } = await getUserKGRequestParam({ user })

  return await new Promise((resolve, reject) => {
    request(`${KG_QUERY_DATASETS_URL}${releasedOnly ? '&databaseScope=RELEASED' : ''}`, option, (err, resp, body) => {
      if (err)
        return reject(err)
      if (resp.statusCode >= 400)
        return reject(resp.statusCode)
      const json = JSON.parse(body)
      return resolve(json)
    })
  })
}


const cacheData = ({ results, ...rest }) => {
  cachedData = results
  otherQueryResult = rest
  return cachedData
}

let fetchingPublicDataInProgress = false
let getPublicDsPr

const getPublicDs = async () => {

  /**
   * every request to public ds will trigger a refresh pull from master KG (throttled pending on resolved request)
   */
  if (!fetchingPublicDataInProgress) {
    fetchingPublicDataInProgress = true
    getPublicDsPr = fetchDatasetFromKg()
      .then(_ => {
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


const getDs = ({ user }) => user
  ? fetchDatasetFromKg({ user }).then(({ results }) => results)
  : getPublicDs()

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
    const { name, relatedAreas } = region
    if (name) set.add(name)
    if (relatedAreas && relatedAreas instanceof Array && relatedAreas.length > 0) {
      for (const relatedArea of relatedAreas) {
        if(typeof relatedArea === 'string') set.add(relatedArea)
        else console.warn(`related area not an instance of String. skipping`, relatedArea)
      }
    }
  }
  return set
}

let juBrainSet = new Set(),
  shortBundleSet = new Set(),
  longBundleSet = new Set(),
  waxholmSet = new Set(),
  allenSet = new Set()

readConfigFile('colin.json')
  .then(data => JSON.parse(data))
  .then(json => {
    const juBrain = flattenArray(json.parcellations[0].regions)
    juBrainSet = populateSet(juBrain)
    
  })
  .catch(console.error)

readConfigFile('MNI152.json')
  .then(data => JSON.parse(data))
  .then(json => {
    const longBundle = flattenArray(json.parcellations.find(({ name }) => name === 'Fibre Bundle Atlas - Long Bundle').regions)
    const shortBundle = flattenArray(json.parcellations.find(({ name }) =>  name === 'Fibre Bundle Atlas - Short Bundle').regions)

    longBundleSet = populateSet(longBundle)
    shortBundleSet = populateSet(shortBundle)
  })
  .catch(console.error)

readConfigFile('waxholmRatV2_0.json')
  .then(data => JSON.parse(data))
  .then(json => {
    const waxholm = flattenArray(json.parcellations[0].regions)

    waxholmSet = populateSet(waxholm)
  })
  .catch(console.error)

readConfigFile('allenMouse.json')
  .then(data => JSON.parse(data))
  .then(json => {
    const flattenedAllen = flattenArray(json.parcellations[0].regions)
    allenSet = populateSet(flattenedAllen)
  })

const filterByPRSet = (prs, atlasPrSet = new Set()) => {
  if (!(atlasPrSet instanceof Set)) throw `atlasPrSet needs to be a set!`
  return prs.some(({ name }) => atlasPrSet.has(name))
}

const filter = (datasets = [], { templateName, parcellationName }) => datasets
  .filter(ds => commonSenseDsFilter({ ds, templateName, parcellationName }))
  .filter(ds => {
    if (/infant/.test(ds.name))
      return false
    if (templateName) {
      return ds.referenceSpaces.some(rs => rs.name === templateName)
    }
    if (parcellationName) {
      if (ds.parcellationRegion.length === 0) return false

      let useSet
      switch (parcellationName) {
        case 'JuBrain Cytoarchitectonic Atlas': 
          useSet = juBrainSet
        break;
        case 'Fibre Bundle Atlas - Short Bundle':
          useSet = shortBundleSet
        break;
        case 'Fibre Bundle Atlas - Long Bundle':
          useSet = longBundleSet
        break;
        case 'Waxholm Space rat brain atlas v.2.0':
          useSet = waxholmSet
        break;
        case 'Allen adult mouse brain reference atlas V3 Brain Atlas':
          useSet = allenSet
        break;
        default:
          useSet = new Set()
      }
      return filterByPRSet(ds.parcellationRegion, useSet)
    }

    return false
  })
  .map(ds => {
    return {
      ...ds,
      preview: hasPreview({ datasetName: ds.name })
    }
  })

/**
 * on init, populate the cached data
 */
exports.init = async () => {
  const { getPublicAccessToken: getPublic } = await kgQueryUtil()
  getPublicAccessToken = getPublic
  return await getPublicDs()
}

exports.getDatasets = ({ templateName, parcellationName, user }) => getDs({ user })
  .then(json => filter(json, { templateName, parcellationName }))

exports.getPreview = ({ datasetName, templateSelected }) => getPreviewFile({ datasetName, templateSelected })

/**
 * TODO
 * change to real spatial query
 */
const cachedMap = new Map()

/**
 * TODO change to URL constructor to improve readability
 */
const spatialQuery = 'https://kg.humanbrainproject.eu/query/neuroglancer/seeg/coordinate/v1.0.0/spatialWithCoordinatesNG/instances?vocab=https%3A%2F%2Fschema.hbp.eu%2FmyQuery%2F'

const getXformFn = (templateSpace) => {
  const _ = {}
  switch(templateSpace){
    case 'Waxholm Space rat brain atlas v.2.0': 
      _['nmToVoxel'] = transformWaxholmV2NmToVoxel
      _['voxelToNm'] = transformWaxholmV2VoxelToNm
      break;
    default: {
      _['nmToVoxel'] = defaultXform
      _['voxelToNm'] = defaultXform
    }
  }
  return _
}

const getSpatialSearcParam = ({ templateName, queryArg }) => {
  let kgSpaceName
  const { nmToVoxel } = getXformFn(templateName)

  const coordsString = queryArg.split('__');
  const boundingBoxCorners = coordsString.map(coordString => coordString.split('_'))
  const bbInVoxelSpace = boundingBoxCorners.map(nmToVoxel)

  switch (templateName){
    case 'Waxholm Space rat brain atlas v.2.0':
      kgSpaceName = 'waxholmV2'
      break;
    default: 
      kgSpaceName = templateName
  }
  return {
    boundingBox: `${kgSpaceName}:${bbInVoxelSpace.map(v => v.join(',')).join(',')}`
  }
}

const fetchSpatialDataFromKg = async ({ templateName, queryGeometry, queryArg, user }) => {

  const { releasedOnly, option } = await getUserKGRequestParam({ user })

  const _ = getSpatialSearcParam({ templateName, queryGeometry, queryArg })
  const url = require('url')
  const search = new url.URLSearchParams()
  
  for (let key in _) {
    search.append(key, _[key])  
  }
  if (releasedOnly) search.append('databaseScope', 'RELEASED')
  
  const _url = `${spatialQuery}&${search.toString()}`
  return await new Promise((resolve, reject) => {
    request(_url, option, (err, resp, body) => {
      if (err)
        return reject(err)
      if (resp.statusCode >= 400) {
        return reject(resp.statusCode)
      }
      const json = JSON.parse(body)

      const { voxelToNm } = getXformFn(templateName)

      const _ = json.results.map(({ name, coordinates, dataset}) => {
        return {
          name,
          templateSpace: templateName,
          dataset: {
            name: dataset[0].name,
            externalLink: 'https://kg.humanbrainproject.eu/instances/Dataset/' + dataset[0].identifier,
          },
          geometry: {
            type: 'point',
            space: 'real',
            position: voxelToNm([
              coordinates[0].x,
              coordinates[0].y,
              coordinates[0].z
            ])
          }
        }
      })

      return resolve(_)
    })
  })
}

exports.getSpatialDatasets = async ({ templateName, queryGeometry, queryArg, user }) => {
  /**
   * Local data can be injected here
   */
  return await fetchSpatialDataFromKg({ templateName, queryGeometry, queryArg, user })
}

let publicAccessToken

async function getUserKGRequestParam({ user }) {
    /**
     * n.b. ACCESS_TOKEN env var is usually only set during dev
     */
    const accessToken = (user && user.tokenset && user.tokenset.access_token) || process.env.ACCESS_TOKEN
    const releasedOnly = !accessToken
    if (!accessToken && !publicAccessToken && getPublicAccessToken) {
        publicAccessToken = await getPublicAccessToken()
    }
    const option = accessToken || publicAccessToken
        ? {
            auth: {
                'bearer': accessToken || publicAccessToken
            }
        }
        : {}

    return {
      option,
      releasedOnly,
      token: accessToken || publicAccessToken
    }
}

/**
 * perhaps export the xform fns into a different module
 * ideally, in the future, KG can handle xform of voxel to nm
 */
const transformWaxholmV2NmToVoxel = (coord) => {
  /**
   * as waxholm is already in RAS, does not need to swap axis
   */

  /**
   * atlas viewer applies translation (below in nm) in order to center the brain
   * query already translates nm to mm, so the unit of transl should be [mm, mm, mm]
   */
  const transl = [-9550781, -24355468, -9707031].map(v => v / 1e6)

  /**
   * mm/voxel
   */
  const voxelDim = [0.0390625, 0.0390625, 0.0390625]
  return coord.map((v, idx) => (v - transl[idx]) / voxelDim[idx])
}

const transformWaxholmV2VoxelToNm = (coord) => {
  const transl = [-9550781, -24355468, -9707031].map(v => v / 1e6)
  const voxelDim = [0.0390625, 0.0390625, 0.0390625]
  return coord.map((v, idx) => (v * voxelDim[idx]) + transl[idx])
}

const defaultXform = (coord) => coord
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

const getDatasetFileAsZip = async ({ user, kgId } = {}) => {
  if (!kgId) {
    throw new Error('kgId must be defined')
  }

  const result = await getDatasetFromId({ user, kgId })
  const { files } = result
  const zip = archiver('zip')
  for (let file of files) {
    const { name, absolutePath } = file
    zip.append(request(absolutePath), { name })
  }

  zip.finalize()

  return zip
}

exports.getDatasetFromId = getDatasetFromId
exports.getDatasetFileAsZip = getDatasetFileAsZip
