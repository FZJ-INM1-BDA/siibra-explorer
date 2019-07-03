const fs = require('fs')
const request = require('request')
const URL = require('url')
const path = require('path')
const archiver = require('archiver')
const { commonSenseDsFilter } = require('./supplements/commonSense')
const { getPreviewFile, hasPreview } = require('./supplements/previewFile')
const { manualFilter: manualFilterDWM, manualMap: manualMapDWM } = require('./supplements/util/mapDwm')

const kgQueryUtil = require('./../auth/util')

let cachedData = null
let otherQueryResult = null

const KG_ROOT = process.env.KG_ROOT || `https://kg.humanbrainproject.org`
const KG_PATH = process.env.KG_PATH || `/query/minds/core/dataset/v1.0.0/interactiveViewerKgQuery-v0_1`
const KG_PARAM = {
  size: process.env.KG_SEARCH_SIZE || '450',
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


const cacheData = ({results, ...rest}) => {
  cachedData = results
  otherQueryResult = rest
  return cachedData
}

const getPublicDs = () => Promise.race([
  new Promise((rs, rj) => {
    setTimeout(() => {
      if (cachedData) {
        rs(cachedData)
      } else {
        /**
         * cached data not available, have to wait
         */
      }
    }, timeout)
  }),
  fetchDatasetFromKg().then(cacheData)
])


const getDs = ({ user }) => user
  ? fetchDatasetFromKg({ user }).then(({results}) => results)
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
    if(err) reject(err)
    resolve(data)
  })
})

let juBrain = null
let shortBundle = null
let longBundle = null
let waxholm = null
let allen = null

readConfigFile('colin.json')
  .then(data => JSON.parse(data))
  .then(json => {
    juBrain = flattenArray(json.parcellations[0].regions)
  })
  .catch(console.error)

readConfigFile('MNI152.json')
  .then(data => JSON.parse(data))
  .then(json => {
    longBundle = flattenArray(json.parcellations[0].regions)
    shortBundle = flattenArray(json.parcellations[1].regions)
  })
  .catch(console.error)

readConfigFile('waxholmRatV2_0.json')
  .then(data => JSON.parse(data))
  .then(json => {
    waxholm = flattenArray(json.parcellations[0].regions)
  })
  .catch(console.error)

/**
 * deprecated
 */
const filterByPRs = (prs, atlasPr) => atlasPr
  ? prs.some(pr => {
      const regex = new RegExp(pr.name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i')
      return atlasPr.some(aPr => regex.test(aPr.name)
        || aPr.synonyms && aPr.synonyms.length && aPr.synonyms.some(syn => syn === pr.name) )
    })
  : false

const manualFilter = require('./supplements/parcellation')


const filter = (datasets = [], {templateName, parcellationName}) => datasets
  .filter(ds => commonSenseDsFilter({ds, templateName, parcellationName }))
  .filter(ds => {
    if (/infant/.test(ds.name))
      return false
    if (templateName) {
      return ds.referenceSpaces.some(rs => rs.name === templateName)
    }
    if (parcellationName) {
      if (parcellationName === 'Fibre Bundle Atlas - Long Bundle'){
        return manualFilterDWM(ds)
      }
      return ds.parcellationRegion.length > 0
        ? filterByPRs(
            ds.parcellationRegion, 
            parcellationName === 'JuBrain Cytoarchitectonic Atlas' && juBrain
              ? juBrain
              : parcellationName === 'Fibre Bundle Atlas - Short Bundle' && shortBundle
                ? shortBundle
                : parcellationName === 'Waxholm Space rat brain atlas v.2.0'
                  ? waxholm
                  : null
          )
        : false
    }

    return false
  })
  .map(ds => {
    if (parcellationName && parcellationName === 'Fibre Bundle Atlas - Long Bundle') {
      return manualMapDWM(ds)
    }
    return {
      ...ds,
      ...parcellationName && ds.parcellationRegion.length === 0
        ? { parcellationRegion: [{ name: manualFilter({ parcellationName, dataset: ds }) }] }
        : {},
      preview: hasPreview({ datasetName: ds.name })
    }
  })

/**
 * on init, populate the cached data
 */
exports.init = async () => {
  const { getPublicAccessToken: getPublic } = await kgQueryUtil()
  getPublicAccessToken = getPublic
  const {results = []} = await fetchDatasetFromKg()
  cachedData = results
}

exports.getDatasets = ({ templateName, parcellationName, user }) => getDs({ user })
    .then(json => filter(json, {templateName, parcellationName}))

exports.getPreview = ({ datasetName, templateSelected }) => getPreviewFile({ datasetName, templateSelected })

/**
 * TODO
 * change to real spatial query
 */
const cachedMap = new Map()
const fetchSpatialDataFromKg = async ({ templateName, queryArg, user }) => {
   try {
    const filename = path.join(STORAGE_PATH, templateName + '.json')
    const exists = fs.existsSync(filename)

    if (!exists)
      return []

    
    const data = fs.readFileSync(filename, 'utf-8')
    const json = JSON.parse(data)
    const coordsString = queryArg.split('__');
    const boundingBoxCorners = coordsString.map(coordString => coordString.split('_'))

    if (templateName !== 'Waxholm Space rat brain atlas v.2.0') {
      return json.filter(filterByqueryArg(boundingBoxCorners))
    } else {
        const boundingBoxInWaxhomV2VoxelSpace = boundingBoxCorners.map(transformWaxholmV2NmToVoxel)
        const { total = 0 } = await getSpatialSearchOk({boundingBoxInWaxhomV2VoxelSpace, user})
        if (total > 0) {
            return json.filter(filterByqueryArg(boundingBoxCorners))
        } else {
            return []
        }
    }
   } catch (e) {
    console.log('datasets#query.js#fetchSpatialDataFromKg', 'read file and parse json failed', e)
    return []
  }
}

exports.getSpatialDatasets = async ({ templateName, queryGeometry, queryArg, user }) => {
  return await fetchSpatialDataFromKg({ templateName, queryArg, user })
}


function filterByqueryArg(cubeDots) {
  return function (item) {
    const px = item.geometry.position[0]
    const py = item.geometry.position[1]
    const pz = item.geometry.position[2]
    if (cubeDots[0][0] <= px && px <= cubeDots[1][0] 
      && cubeDots[0][1] <= py && py <= cubeDots[1][1] 
      && cubeDots[0][2] <= pz && pz <= cubeDots[1][2]) {
      return true
    }
    return false
  } 
}


async function getSpatialSearchOk({ user, boundingBoxInWaxhomV2VoxelSpace }) {

    const { releasedOnly, option } = await getUserKGRequestParam({ user })

    const spatialQuery = 'https://kg.humanbrainproject.org/query/minds/core/dataset/v1.0.0/spatialSimple/instances?size=10'

    return await new Promise((resolve, reject) => {
        request(`${spatialQuery}&boundingBox=waxholmV2:${boundingBoxInWaxhomV2VoxelSpace.map(cornerCoord => cornerCoord.join(',')).join(',')}${releasedOnly ? '&databaseScope=RELEASED' : ''}`, option, (err, resp, body) => {
            if (err)
                return reject(err)
            if (resp.statusCode >= 400)
                return reject(resp.statusCode)
            const json = JSON.parse(body)
            return resolve(json)
        })
    })
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
 * 
 */
const transformWaxholmV2NmToVoxel = (coord) => {
  /**
   * as waxholm is already in RAS, does not need to swap axis
   */

  /**
   * atlas viewer applies translation (below in nm) in order to center the brain
   * query already translates nm to mm, so the unit of transl should be [mm, mm, mm]
   */
  const transl = [-9550781,-24355468,-9707031].map(v => v / 1e6)
  
  /**
   * mm/voxel
   */
  const voxelDim = [0.0390625, 0.0390625, 0.0390625]
  return coord.map((v, idx) => (v - transl[idx]) / voxelDim[idx] )
}

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