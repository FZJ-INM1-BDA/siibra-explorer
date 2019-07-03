const fs = require('fs')
const request = require('request')
const path = require('path')
const { commonSenseDsFilter } = require('./supplements/commonSense')
const { getPreviewFile, hasPreview } = require('./supplements/previewFile')
const { manualFilter: manualFilterDWM, manualMap: manualMapDWM } = require('./supplements/util/mapDwm')

const kgQueryUtil = require('./../auth/util')

let cachedData = null
let otherQueryResult = null
const queryUrl = process.env.KG_DATASET_QUERY_URL || `https://kg.humanbrainproject.org/query/minds/core/dataset/v1.0.0/interactiveViewerKgQuery/instances?size=450&vocab=https%3A%2F%2Fschema.hbp.eu%2FmyQuery%2F`
const timeout = process.env.TIMEOUT || 5000
const STORAGE_PATH = process.env.STORAGE_PATH || path.join(__dirname, 'data')

let getPublicAccessToken

const fetchDatasetFromKg = async ({ user } = {}) => {

  const { releasedOnly, option } = await getUserKGRequestInfo({ user })

  return await new Promise((resolve, reject) => {
    request(`${queryUrl}${releasedOnly ? '&databaseScope=RELEASED' : ''}`, option, (err, resp, body) => {
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
    return atlasPr.some(aPr => regex.test(aPr.name))
  })
  : false

const manualFilter = require('./supplements/parcellation')


const filter = (datasets = [], { templateName, parcellationName }) => datasets
  .filter(ds => commonSenseDsFilter({ ds, templateName, parcellationName }))
  .filter(ds => {
    if (/infant/.test(ds.name))
      return false
    if (templateName) {
      return ds.referenceSpaces.some(rs => rs.name === templateName)
    }
    if (parcellationName) {
      if (parcellationName === 'Fibre Bundle Atlas - Long Bundle') {
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
  const { results = [] } = await fetchDatasetFromKg()
  cachedData = results
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
const spatialQuery = 'https://kg.humanbrainproject.eu/query/neuroglancer/seeg/coordinate/v1.0.0/spatialWithCoordinates/instances?vocab=https%3A%2F%2Fschema.hbp.eu%2FmyQuery%2F'

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

  const { releasedOnly, option } = await getUserKGRequestInfo({ user })

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

      const _ = json.results.map(({ name, coordinates}) => {
        return {
          name,
          templateSpace: templateName,
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

async function getUserKGRequestInfo({ user }) {
  const accessToken = user && user.tokenset && user.tokenset.access_token
  const releasedOnly = !accessToken
  let publicAccessToken
  if (!accessToken && getPublicAccessToken) {
    publicAccessToken = await getPublicAccessToken()
  }
  const option = accessToken || publicAccessToken || process.env.ACCESS_TOKEN
    ? {
      auth: {
        'bearer': accessToken || publicAccessToken || process.env.ACCESS_TOKEN
      }
    }
    : {}

  return {option, releasedOnly}
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