const router = require('express').Router()
const request = require('request')

/**
 * TODO migrate to brainscape in the future
 */

const REGIONAL_FEATURE_ENDPOINT_ARRAY = process.env.REGIONAL_FEATURE_ENDPOINT_ARRAY || []

let arrayToFetch = []
try {
  arrayToFetch = JSON.parse(REGIONAL_FEATURE_ENDPOINT_ARRAY)
} catch (e) {
  console.warn(`parsing arrayToFetch parse failed`)
}

const regionIdToDataIdMap = new Map()
const datasetIdToDataMap = new Map()
const datasetIdDetailMap = new Map()

let additionalDatasets = []
const returnAdditionalDatasets = async () => additionalDatasets
let isReady = false

const ITERABLE_KEY_SYMBOL = Symbol('ITERABLE_KEY_SYMBOL')

/**
 * this pattern allows all of the special data to be fetched in parallel
 * async await would mean it is fetched one at a time
 */

Promise.all(
  arrayToFetch.map(url =>
    new Promise((rs, rj) => {
      request.get(url, (err, _resp, body) => {
        if (err) return rj(err)
        const { regions, data, ['@id']: datasetId, type, name } = JSON.parse(body)
        datasetIdDetailMap.set(datasetId, {
          ['@id']: datasetId,
          type,
          name
        })
        for (const { status, ['@id']: regionId, name, files } of regions) {
          if (regionIdToDataIdMap.has(regionId)) {
            const existingObj = regionIdToDataIdMap.get(regionId)
            existingObj[datasetId][status] = (existingObj[datasetId][status] || []).concat(files)
            existingObj[datasetId][ITERABLE_KEY_SYMBOL] = existingObj[datasetId][ITERABLE_KEY_SYMBOL].concat(status)
          } else {
            const datasetObj = {
              [status]: files,
              type,
            }
            datasetObj[ITERABLE_KEY_SYMBOL] = [status]
            const obj = {
              name,
              '@id': regionId,
              [datasetId]: datasetObj
            }
            obj[ITERABLE_KEY_SYMBOL] = [datasetId]
            regionIdToDataIdMap.set(regionId, obj)
          }
        }
        
        const dataIdToDataMap = new Map()
        datasetIdToDataMap.set(datasetId, dataIdToDataMap)

        for (const { ['@id']: dataId, contact_points: contactPoints, referenceSpaces } of data) {
          dataIdToDataMap.set(dataId, {
            ['@id']: dataId,
            contactPoints,
            referenceSpaces,
          })
        }
        rs()
      })
    })
  )
).then(() => {
  const map = new Map()
  for (const [regionId, regionObj] of regionIdToDataIdMap.entries()) {
    for (const datasetId of regionObj[ITERABLE_KEY_SYMBOL]) {
      const newArr = (map.get(datasetId) || []).concat(regionId)
      map.set(datasetId, newArr)
    }
  }

  for (const [ datasetId, arrRegionIds ] of map.entries()) {
    additionalDatasets = additionalDatasets.concat({
      fullId: datasetId,
      parcellationRegion: arrRegionIds.map(id => ({ fullId: id })),
      species: [],
      kgReference: [
        `https://kg.ebrains.eu/search/instances/Dataset/${datasetId}`
      ]
    })
  }

  isReady = true
})

const getFeatureMiddleware = (req, res, next) => {
  const { featureFullId } = req.params
  const datasetIdToDataMapToUse = res.locals['overwrite_datasetIdToDataMap'] || datasetIdToDataMap
  if (!datasetIdToDataMapToUse.has(featureFullId)) {
    return res.status(404).send(`Not found. - getFeatureMiddleware -`)
  }
  res.locals['getFeatureMiddleware_cache_0'] = datasetIdToDataMapToUse.get(featureFullId)
  res.locals['getFeatureMiddleware_cache_1'] = datasetIdDetailMap.get(featureFullId)
  next()
}

const sendFeatureResponse = (req, res) => {
  if (!res.locals['getFeatureMiddleware_cache_0']) return res.status(500).send(`getFeatureMiddleware_cache_0 not populated`)
  const fullIdMap = res.locals['getFeatureMiddleware_cache_0']
  const featureDetail = res.locals['getFeatureMiddleware_cache_1'] || {}
  const dataKeys = Array.from(fullIdMap.keys())
  return res.status(200).json({
    ...featureDetail,
    data: dataKeys.map(dataId => {
      return {
        ['@id']: dataId,
      }
    })
  })
}

const getFeatureGetDataMiddleware = (req, res, next) => {
  const { dataId } = req.params
  if (!res.locals['getFeatureMiddleware_cache_0']) return res.status(500).send(`getFeatureMiddleware_cache_0 not populated`)
  const map = res.locals['getFeatureMiddleware_cache_0']
  if (!map.has(dataId)) {
    return res.status(404).send(`Not found. - getFeatureGetDataMiddleware -`)
  }
  res.locals['getFeatureGetDataMiddleware_cache_0'] = map.get(dataId)
  next()
}

const sendFeatureDataResponse = (req, res) => {
  if (!res.locals['getFeatureGetDataMiddleware_cache_0']) return res.stauts(500).send(`getFeatureGetDataMiddleware_cache_0 not populated`)
  const result = res.locals['getFeatureGetDataMiddleware_cache_0']
  res.status(200).json(result)
}

router.get(
  '/byFeature/:featureFullId',
  getFeatureMiddleware,
  sendFeatureResponse,
)

router.get(
  '/byFeature/:featureFullId/:dataId',
  getFeatureMiddleware,
  getFeatureGetDataMiddleware,
  sendFeatureDataResponse,
)

const byRegionMiddleware = (req, res, next) => {

  const { regionFullId } = req.params
  const { hemisphere, referenceSpaceId } = req.query

  if (!regionIdToDataIdMap.has(regionFullId)) {
    return res.status(404).send(`Not found. - byRegionMiddleware -`)
  }

  /**
   * datasetIdToDataMap:
   * datasetId -> dataId -> { ['@id']: string, contactPoints, referenceSpaces }
   */
  const overWriteDatasetIdToMap = new Map()
  res.locals['byRegionMiddleware_cache_0'] = overWriteDatasetIdToMap
  res.locals['overwrite_datasetIdToDataMap'] = overWriteDatasetIdToMap

  /**
   * TODO filter by reference spaces
   */

  const regionObj = regionIdToDataIdMap.get(regionFullId)

  for (const datasetId of regionObj[ITERABLE_KEY_SYMBOL]) {
    const returnMap = new Map()
    overWriteDatasetIdToMap.set(datasetId, returnMap)
    for (const hemisphereKey of regionObj[datasetId][ITERABLE_KEY_SYMBOL]) {
      
      /**
       * if hemisphere is defined, then skip if hemisphereKey does not match
       */

      if (!!hemisphere && hemisphereKey !== hemisphere) continue
      for (const { ['@id']: dataId } of regionObj[datasetId][hemisphereKey] || []) {
        try {
          const dataObj = datasetIdToDataMap.get(datasetId).get(dataId)
          if (
            !!referenceSpaceId
            && !! dataObj['referenceSpaces']
            && dataObj['referenceSpaces'].every(rs => rs['fullId'] !== referenceSpaceId)
          ) {
            continue
          }
          returnMap.set(
            dataId,
            dataObj
          )
        } catch (e) {
          console.warn(`${datasetId} or ${dataId} could not be found in datasetIdToDataMap`)
        }
      }
    }
  }

  next()
}

router.get(
  '/byRegion/:regionFullId',
  byRegionMiddleware,
  async (req, res) => {
    if (!res.locals['byRegionMiddleware_cache_0']) return res.status(500).send(`byRegionMiddleware_cache_0 not populated`)

    const returnMap = res.locals['byRegionMiddleware_cache_0']
    return res.status(200).json({
      features: Array.from(returnMap.keys()).map(id => ({ ['@id']: id }))
    })
  }
)

router.get(
  '/byRegion/:regionFullId/:featureFullId',
  byRegionMiddleware,
  getFeatureMiddleware,
  sendFeatureResponse,
)

router.get(
  '/byRegion/:regionFullId/:featureFullId/:dataId',
  byRegionMiddleware,
  getFeatureMiddleware,
  getFeatureGetDataMiddleware,
  sendFeatureDataResponse,
)

const regionalFeatureIsReady = async () => isReady

module.exports = {
  router,
  regionalFeatureIsReady,
  returnAdditionalDatasets,
}
