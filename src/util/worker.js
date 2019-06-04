const validTypes = [
  'CHECK_MESHES',
  'GET_LANDMARKS_VTK',
  'GET_USERLANDMARKS_VTK',
  'BUILD_REGION_SELECTION_TREE',
  'PROPAGATE_NG_ID'
]

const validOutType = [
  'CHECKED_MESH',
  'ASSEMBLED_LANDMARKS_VTK',
  'ASSEMBLED_USERLANDMARKS_VTK',
  'RETURN_REBUILT_REGION_SELECTION_TREE',
  'UPDATE_PARCELLATION_REGIONS'
]

const checkMeshes = (action) => {
  
  /* filtering now done on the angular level */
  const baseUrl = action.baseUrl
  fetch(`${baseUrl}/info`)
    .then(res => res.json())
    .then(({mesh}) => {
      if (mesh)
        return mesh
      else 
        throw new Error('mesh does not exist')
    })
    .then(meshPath => action.indices.forEach(index => {
      fetch(`${baseUrl}/${meshPath}/${index}:0`)
        .then(res => res.json())
        .then(json => {
          /* the perspectiveEvent only counts json that has fragments as a part of meshLoaded */
          if(json.fragments && json.fragments.constructor === Array && json.fragments.length > 0){
            postMessage({
              type: 'CHECKED_MESH',
              parcellationId: action.parcellationId,
              checkedIndex: index,
              baseUrl
            })
          }
        })
        .catch(error => {
          /* no cors error is also caught here, but also printed to the console */
        })
    }))
    .catch(error => {
      // console.error('parsing info json error', error)
    })
}

const vtkHeader = `# vtk DataFile Version 2.0
Created by worker thread at https://github.com/HumanBrainProject/interactive-viewer
ASCII
DATASET POLYDATA`

const getVertexHeader = (numVertex) => `POINTS ${numVertex} float`

const getPolyHeader = (numPoly) => `POLYGONS ${numPoly} ${4 * numPoly}`

const getLabelHeader = (numVertex) => `POINT_DATA ${numVertex}
SCALARS label unsigned_char 1
LOOKUP_TABLE none`

//pos in nm
const getIcoVertex = (pos, scale) => `-525731.0 0.0 850651.0
525731.0 0.0 850651.0
-525731.0 0.0 -850651.0
525731.0 0.0 -850651.0
0.0 850651.0 525731.0
0.0 850651.0 -525731.0
0.0 -850651.0 525731.0
0.0 -850651.0 -525731.0
850651.0 525731.0 0.0
-850651.0 525731.0 0.0
850651.0 -525731.0 0.0
-850651.0 -525731.0 0.0`
  .split('\n')
  .map(line => 
    line
      .split(' ')
      .map((string, idx) => (Number(string) * (scale ? scale : 1) + pos[idx]).toString() )
      .join(' ')
    )
  .join('\n')


const getIcoPoly = (startingIdx) => `3 1 4 0
3 4 9 0
3 4 5 9
3 8 5 4
3 1 8 4
3 1 10 8
3 10 3 8
3 8 3 5
3 3 2 5
3 3 7 2
3 3 10 7
3 10 6 7
3 6 11 7
3 6 0 11
3 6 1 0
3 10 1 6
3 11 0 9
3 2 11 9
3 5 2 9
3 11 2 7`
  .split('\n')
  .map((line) => 
    line
      .split(' ')
      .map((v,idx) => idx === 0 ? v : (Number(v) + startingIdx).toString() )
      .join(' ')
    )
  .join('\n')

const getMeshVertex = (vertices) =>  vertices.map(vertex => vertex.join(' ')).join('\n')
const getMeshPoly = (polyIndices, currentIdx) => polyIndices.map(triplet => 
  '3 '.concat(triplet.map(index => 
    index + currentIdx
  ).join(' '))
).join('\n')


const encoder = new TextEncoder()

const parseLmToVtk = (landmarks, scale) => {

  const reduce = landmarks.reduce((acc,curr,idx) => {
    //curr : null | [number,number,number] | [ [number,number,number], [number,number,number], [number,number,number] ][]
    if(curr === null)
      return acc
    if(!isNaN(curr[0]))
      /**
       * point primitive, render icosahedron
       */
      return {
        currentVertexIndex : acc.currentVertexIndex + 12,
        vertexString : acc.vertexString.concat(getIcoVertex(curr, scale)),
        polyCount : acc.polyCount + 20,
        polyString : acc.polyString.concat(getIcoPoly(acc.currentVertexIndex)),
        labelString : acc.labelString.concat(Array(12).fill(idx.toString()).join('\n'))
      }
    else{
      //curr[0] : [number,number,number][] vertices
      //curr[1] : [number,number,number][] indices for the vertices that poly forms
      
      /**
       * poly primitive
       */
      const vertices = curr[0]
      const polyIndices = curr[1]

      return {
        currentVertexIndex : acc.currentVertexIndex + vertices.length,
        vertexString : acc.vertexString.concat(getMeshVertex(vertices)),
        polyCount : acc.polyCount + polyIndices.length,
        polyString : acc.polyString.concat(getMeshPoly(polyIndices, acc.currentVertexIndex)),
        labelString : acc.labelString.concat(Array(vertices.length).fill(idx.toString()).join('\n'))
      }
    }
  }, {
    currentVertexIndex : 0,
    vertexString : [],
    polyCount : 0,
    polyString: [],
    labelString : [],
  })

  // if no vertices are been rendered, do not replace old 
  if(reduce.currentVertexIndex === 0)
    return false

  return vtkHeader
    .concat('\n')
    .concat(getVertexHeader(reduce.currentVertexIndex))
    .concat('\n')
    .concat(reduce.vertexString.join('\n'))
    .concat('\n')
    .concat(getPolyHeader(reduce.polyCount))
    .concat('\n')
    .concat(reduce.polyString.join('\n'))
    .concat('\n')
    .concat(getLabelHeader(reduce.currentVertexIndex))
    .concat('\n')
    .concat(reduce.labelString.join('\n'))
}

let landmarkVtkUrl

const getLandmarksVtk = (action) => {

  // landmarks are array of triples in nm (array of array of numbers)
  const landmarks = action.landmarks
  const template = action.template
  const scale = action.scale
    ? action.scale
    : 2.8

  const vtk = parseLmToVtk(landmarks, scale)
  
  if(!vtk)
    return

  // when new set of landmarks are to be displayed, the old landmarks will be discarded
  if(landmarkVtkUrl)
    URL.revokeObjectURL(landmarkVtkUrl)

  landmarkVtkUrl = URL.createObjectURL(new Blob( [encoder.encode(vtk)], {type : 'application/octet-stream'} ))
  postMessage({
    type : 'ASSEMBLED_LANDMARKS_VTK',
    template,
    url : landmarkVtkUrl
  })
}

let userLandmarkVtkUrl

const getuserLandmarksVtk = (action) => {
  const landmarks = action.landmarks
  const scale = action.scale
    ? action.scale
    : 2.8

  /**
   * if userlandmarks vtk is empty, that means user removed all landmarks
   * thus, removing revoking URL, and send null as assembled userlandmark vtk
   */
  if (landmarks.length === 0) {

    if(userLandmarkVtkUrl) URL.revokeObjectURL(userLandmarkVtkUrl)

    postMessage({
      type: 'ASSEMBLED_USERLANDMARKS_VTK'
    })

    return
  }

  const vtk = parseLmToVtk(landmarks, scale)
  if(!vtk)
    return

  if(userLandmarkVtkUrl)
    URL.revokeObjectURL(userLandmarkVtkUrl)

  userLandmarkVtkUrl = URL.createObjectURL(new Blob( [encoder.encode(vtk)], {type : 'application/octet-stream'} ))
  postMessage({
    type : 'ASSEMBLED_USERLANDMARKS_VTK',
    url : userLandmarkVtkUrl
  })
}

const rebuildSelectedRegion = (payload) => {
  const { selectedRegions, regions } = payload

  /**
   * active tree branch
   * branch is active if ALL children are active
   */
  const activeTreeBranch = []
  const isRegionActive = (region) => selectedRegions.some(r => r.name === region.name)
    || region.children && region.children.length > 0 && region.children.every(isRegionActive)
  
  /**
   * some active tree branch
   * branch is active if SOME children are active
   */
  const someActiveTreeBranch = []
  const isSomeRegionActive = (region) => selectedRegions.some(r => r.name === region.name)
    || region.children && region.children.length > 0 && region.children.some(isSomeRegionActive)

  const handleRegion = (r) => {
    isRegionActive(r) ? activeTreeBranch.push(r) : {}
    isSomeRegionActive(r) ? someActiveTreeBranch.push(r) : {}
    if (r.children && r.children.length > 0) 
      r.children.forEach(handleRegion)
  }
  regions.forEach(handleRegion)
  postMessage({
    type: 'RETURN_REBUILT_REGION_SELECTION_TREE',
    rebuiltSelectedRegions: activeTreeBranch,
    rebuiltSomeSelectedRegions: someActiveTreeBranch
  })
}

const propagateNgId = (parcellation) => {
  const recursivePropagateNgId = (region, {ngId}) => {
    return {
      ngId,
      ...region,
      ...( region.children && region.children.map
        ? {
          children: region.children.map(c => recursivePropagateNgId(c, { ngId: region.ngId || ngId }))
        }
        : {} )
    }
  }
  const regions = parcellation.regions && parcellation.regions.map
    ? parcellation.regions.map(r => recursivePropagateNgId(r, { ngId: parcellation.ngId }))
    : []

  return {
    ...parcellation,
    regions
  }
}

const processPropagateNgId = (payload) => {
  const { parcellation } = payload
  const p = parcellation.ngId
    ? parcellation
    : propagateNgId(parcellation)
  postMessage({
    type: 'UPDATE_PARCELLATION_REGIONS',
    parcellation: p
  })
}

onmessage = (message) => {
  
  if(validTypes.findIndex(type => type === message.data.type) >= 0){
    switch(message.data.type){
      case 'CHECK_MESHES':
        checkMeshes(message.data)
        return
      case 'GET_LANDMARKS_VTK':
        getLandmarksVtk(message.data)
        return
      case 'GET_USERLANDMARKS_VTK':
        getuserLandmarksVtk(message.data)
        return
      case 'BUILD_REGION_SELECTION_TREE':
        rebuildSelectedRegion(message.data)
        return
      case 'PROPAGATE_NG_ID':
        processPropagateNgId(message.data)
        return
      default:
        console.warn('unhandled worker action', message)
    }
  } else {
    console.warn('unhandled worker action', message)
  }
}
