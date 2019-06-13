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

const fetchDatasetFromKg = async (arg) => {

  const accessToken = arg && arg.user && arg.user.tokenset && arg.user.tokenset.access_token
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

const parcellationNameToFlattenedRegion = new Map()

const appendMap = (parcellation) => {
  const { name, regions } = parcellation
  parcellationNameToFlattenedRegion.set(name, flattenArray(regions))
}

readConfigFile('bigbrain.json')
  .then(data => JSON.parse(data))
  .then(json => {
    const p = json.parcellations.find(p => p.name === 'Cytoarchitectonic Maps')
    if (p) {
      appendMap(p)
    }
  })
  .catch(console.error)

readConfigFile('colin.json')
  .then(data => JSON.parse(data))
  .then(json => {
    const p = json.parcellations.find(p => p.name === 'JuBrain Cytoarchitectonic Atlas')
    if (p) {
      appendMap(p)
    }
  })
  .catch(console.error)

readConfigFile('MNI152.json')
  .then(data => JSON.parse(data))
  .then(json => {
    const p1 = json.parcellations.find(p => p.name === 'fibre bundle long')
    if (p1) {
      appendMap(p1)
    }
    const p2 = json.parcellations.find(p => p.name === 'fibre bundle short')
    if (p2) {
      appendMap(p2)
    }
  })
  .catch(console.error)

readConfigFile('waxholmRatV2_0.json')
  .then(data => JSON.parse(data))
  .then(json => {
    const p = json.parcellations.find(p => p.name === 'Waxholm Space rat brain atlas v.2.0')
    if (p) {
      appendMap(p)
    }
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


const filterDataset = (datasets = [], {templateName, parcellationName}) => datasets
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
      if (ds.parcellationRegion.length > 0) {
        const flattenedRegions = parcellationNameToFlattenedRegion.get(parcellationName)
        if (flattenedRegions) {
          return filterByPRs(ds.parcellationRegion, flattenedRegions)
        }
      } else {
        return false
      }
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

exports.getDatasets = ({ templateName, parcellationName, user }) => (user
  ? fetchDatasetFromKg({ user }).then(({results}) => results)
  : getPublicDs())
    .then(json => filterDataset(json, {templateName, parcellationName}))

exports.getPreview = ({ datasetName, templateSelected }) => getPreviewFile({ datasetName, templateSelected })

/**
 * TODO
 * change to real spatial query
 */
const cachedMap = new Map()
const fetchSpatialDataFromKg = async ({ templateName, queryArg }) => {
  // const cachedResult = cachedMap.get(templateName)
  // if (cachedResult) 
  //   return cachedResult
    
  try {
    const filename = path.join(STORAGE_PATH, templateName + '.json')
    const exists = fs.existsSync(filename)

    if (!exists)
      return []
    
    const data = fs.readFileSync(filename, 'utf-8')
    const json = JSON.parse(data)
    var splitQueryArg = queryArg.split('__');
    const cubeDots = []    
    splitQueryArg.forEach(element => {
      cubeDots.push(element.split('_'))
    });

    // cachedMap.set(templateName, json.filter(filterByqueryArg(cubeDots)))
    return json.filter(filterByqueryArg(cubeDots))
  } catch (e) {
    console.log('datasets#query.js#fetchSpatialDataFromKg', 'read file and parse json failed', e)
    return []
  }
}

exports.getSpatialDatasets = async ({ templateName, queryGeometry, queryArg }) => {
  return await fetchSpatialDataFromKg({ templateName, queryArg })
}


function filterByqueryArg(cubeDots) {
  return function (item) {
    const px = item.geometry.position[0]
    const py = item.geometry.position[1]
    const pz = item.geometry.position[2]
    if (cubeDots[0][0] <= px && px <= cubeDots[1][0] 
      && cubeDots[0][1] <= py && py <= cubeDots[1][1] 
      && cubeDots[0][2] <= pz && pz <= cubeDots[1][2]) {
      return true;
    }
  } 
  return false;   
}
    
