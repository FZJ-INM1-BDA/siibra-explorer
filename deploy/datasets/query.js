const fs = require('fs')
const request = require('request')
const path = require('path')

let cachedData = null
let otherQueryResult = null
const queryUrl = process.env.KG_DATASET_QUERY_URL || `https://kg-int.humanbrainproject.org/query/minds/core/dataset/v1.0.0/interactiveViewerKgQuery/instances?size=450&vocab=https%3A%2F%2Fschema.hbp.eu%2FmyQuery%2F`
const timeout = process.env.TIMEOUT || 5000

const fetchDatasetFromKg = (arg) => new Promise((resolve, reject) => {
  const accessToken = arg && arg.user && arg.user.tokenset && arg.user.tokenset.access_token
  const option = accessToken
    ? {
        auth: {
          'bearer': accessToken
        }
      }
    : {}
  request(queryUrl, option, (err, resp, body) => {
    if (err)
      return reject(err)
    if (resp.statusCode >= 400)
      return reject(resp.statusCode)
    const json = JSON.parse(body)
    return resolve(json)
  })
})

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
  const filepath = path.join(__dirname, '..', 'res', filename)
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
      const regex = new RegExp((pr.name))
      return atlasPr.some(aPr => regex.test(aPr.name))
    })
  : false

const filter = (datasets, {templateName, parcellationName}) => datasets.filter(ds => {
  if (templateName) {
    return templateName === 'undefined'
      ? ds.referenceSpaces.length === 0
      : ds.referenceSpaces.some(rs => rs.name === templateName)
  }
  if (parcellationName) {
    return ds.parcellationRegion.length > 0
      ? filterByPRs(
          ds.parcellationRegion, 
          parcellationName === 'JuBrain Cytoarchitectonic Atlas' && juBrain && !/infant/.test(ds.name)
            ?  juBrain
            : parcellationName === 'Fibre Bundle Atlas - Long Bundle' && longBundle
              ?  longBundle
              : parcellationName === 'Fibre Bundle Atlas - Short Bundle' && shortBundle
                ?  shortBundle
                : null
        )
      : false
  }

  return false
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


