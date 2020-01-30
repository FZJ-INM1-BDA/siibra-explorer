const url = require('url')
const request = require('request')
const { getUserKGRequestParam, constants } = require('./util')
const { transformWaxholmV2NmToVoxel, transformWaxholmV2VoxelToNm } = require('./spatialXform/waxholmRat')

/**
 * TODO change to URL constructor to improve readability
 */

const { KG_ROOT, KG_SEARCH_VOCAB } = constants

const kgParams = {
  vocab: KG_SEARCH_VOCAB
}

const KG_SPATIAL_DATASET_SEARCH_QUERY_NAME = process.env.KG_SPATIAL_DATASET_SEARCH_QUERY_NAME || 'iav-spatial-query-v2'
const KG_SPATIAL_DATASET_SEARCH_PATH = process.env.KG_SPATIAL_DATASET_SEARCH_PATH || '/neuroglancer/seeg/coordinate/v1.0.0'

const kgSpatialDatasetSearchFullString = `${KG_SPATIAL_DATASET_SEARCH_PATH}/${KG_SPATIAL_DATASET_SEARCH_QUERY_NAME}`

const kgQuerySpatialDatasetUrl = new url.URL(`${KG_ROOT}${kgSpatialDatasetSearchFullString}/instances`)

const defaultXform = (coord) => coord

const getXformFn = (templateSpace) => {
  const _ = {}
  switch(templateSpace){
    case 'Waxholm Space rat brain MRI/DTI': 
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
    case 'Waxholm Space rat brain MRI/DTI':
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
  const _url = new url.URL(kgQuerySpatialDatasetUrl)

  for (const key in kgParams){
    _url.searchParams.append(key, kgParams[key])
  }
  
  for (let key in _) {
    _url.searchParams.append(key, _[key])
  }
  if (releasedOnly) _url.searchParams.append('databaseScope', 'RELEASED')

  return await new Promise((resolve, reject) => {
    request(_url, option, (err, resp, body) => {
      if (err) return reject(err)
      if (resp.statusCode >= 400) {
        return reject(resp.statusCode)
      }
      const json = JSON.parse(body)

      const { voxelToNm } = getXformFn(templateName)
      const _ = json.results.map(({ coordinates, ...rest}) => {
        return {
          ...rest,
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


const getSpatialDatasets = async ({ templateName, queryGeometry, queryArg, user }) => {
  /**
   * Local data can be injected here
   */
  return await fetchSpatialDataFromKg({ templateName, queryGeometry, queryArg, user })
}

module.exports = {
  getSpatialDatasets
}