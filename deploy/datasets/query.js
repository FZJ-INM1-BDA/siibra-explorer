const fs = require('fs')
const request = require('request')
const path = require('path')
const { getPreviewFile, hasPreview } = require('./supplements/previewFile')

const kgQueryUtil = require('./../auth/util')

let cachedData = null
let otherQueryResult = null
const queryUrl = process.env.KG_DATASET_QUERY_URL || `https://kg.humanbrainproject.org/query/minds/core/dataset/v1.0.0/interactiveViewerKgQuery/instances?size=450&vocab=https%3A%2F%2Fschema.hbp.eu%2FmyQuery%2F`
const timeout = process.env.TIMEOUT || 5000

let getPublicAccessToken

(async () => {
  try {
    const { getPublicAccessToken: getPublic } = await kgQueryUtil()
    getPublicAccessToken = getPublic
  } catch (e) {
    console.log('kgQueryUtil error', e)
  }
})()

const fetchDatasetFromKg = async (arg) => {

  const accessToken = arg && arg.user && arg.user.tokenset && arg.user.tokenset.access_token
  let publicAccessToken
  if (!accessToken && getPublicAccessToken) {
    try {
      publicAccessToken = await getPublicAccessToken()
    } catch (e) {
      console.log('getPublicAccessToken Error', e)
    }
  }
  const option = accessToken || publicAccessToken || process.env.ACCESS_TOKEN
    ? {
        auth: {
          'bearer': accessToken || publicAccessToken || process.env.ACCESS_TOKEN
        }
      }
    : {}

  return await new Promise((resolve, reject) => {
    request(queryUrl, option, (err, resp, body) => {
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
  return array.filter(item => item.children.length === 0).concat(
    ...array.filter(item => item.children.length > 0).map(item => flattenArray(item.children))
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

const filterByPRs = (prs, atlasPr) => atlasPr
  ? prs.some(pr => {
      const regex = new RegExp(pr.name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'))
      return atlasPr.some(aPr => regex.test(aPr.name))
    })
  : false

const manualFilter = require('./supplements/parcellation')

const filter = (datasets, {templateName, parcellationName}) => datasets
  .filter(ds => {
    if (templateName) {
      return ds.referenceSpaces.some(rs => rs.name === templateName)
    }
    if (parcellationName) {
      return ds.parcellationRegion.length > 0
        ? filterByPRs(
            ds.parcellationRegion, 
            parcellationName === 'JuBrain Cytoarchitectonic Atlas' && juBrain && !/infant/.test(ds.name)
              ? juBrain
              : parcellationName === 'Fibre Bundle Atlas - Long Bundle' && longBundle
                ? longBundle
                : parcellationName === 'Fibre Bundle Atlas - Short Bundle' && shortBundle
                  ? shortBundle
                  : null
          )
        : manualFilter({ parcellationName, dataset: ds })
    }

    return false
  })
  .map(ds => {
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
exports.init = () => fetchDatasetFromKg()
  .then(json => {
    cachedData = json
  })

exports.getDatasets = ({ templateName, parcellationName, user }) => getDs({ user })
    .then(json => filter(json, {templateName, parcellationName}))

exports.getPreview = ({ datasetName }) => getPreviewFile({ datasetName })