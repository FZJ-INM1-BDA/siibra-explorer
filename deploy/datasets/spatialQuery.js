const url = require('url')
const request = require('request')
const { getUserKGRequestParam } = require('./util')
const { transformWaxholmV2NmToVoxel, transformWaxholmV2VoxelToNm } = require('./spatialXform/waxholmRat')

/**
 * TODO change to URL constructor to improve readability
 */
const spatialQuery = 'https://kg.humanbrainproject.eu/query/neuroglancer/seeg/coordinate/v1.0.0/spatialWithCoordinatesNG/instances?vocab=https%3A%2F%2Fschema.hbp.eu%2FmyQuery%2F'

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
          dataset: dataset.map(ds => ds = {name: ds.name, externalLink: 'https://kg.humanbrainproject.eu/instances/Dataset/' + ds.identifier}),
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