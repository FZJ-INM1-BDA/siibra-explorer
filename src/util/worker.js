const validTypes = ['CHECK_MESHES', 'GET_LANDMARK_VTK']
const validOutType = ['CHECKED_MESH', 'ASSEMBLED_LANDMARK_VTK']

const checkMeshes = (action) => {
  
  /* filtering now done on the angular level */
  const baseUrl = action.baseUrl
  fetch(`${baseUrl}/info`)
    .then(res => res.json())
    .then(json => json.mesh
      ? json.mesh
      : new Error(`mesh does not exist on fetched info file: ${JSON.stringify(json)}`))
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
      console.error('parsing info json error', error)
    })
}

const vtkHeader = `# vtk DataFile Version 2.0
Created by worker thread at https://github.com/HumanBrainProject/interactive-viewer
ASCII
DATASET POLYDATA`

const getVertexHeader = (numLandmarks) => `POINTS ${12 * numLandmarks} float`

const getPolyHeader = (numLandmarks) => `POLYGONS ${20 * numLandmarks} ${80 * numLandmarks}`

const getLabelHeader = (numLandmarks) => `POINT_DATA ${numLandmarks * 12}
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

const getIcoPoly = (idx2) => `3 1 4 0
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
      .map((v,idx) => idx === 0 ? v : (Number(v) + idx2 * 12).toString() )
      .join(' ')
    )
  .join('\n')

const getLabelScalar = (idx) => [...Array(12)].map(() => idx.toString()).join('\n')

const ICOSAHEDRON = `# vtk DataFile Version 2.0
Converted using https://github.com/HumanBrainProject/neuroglancer-scripts
ASCII
DATASET POLYDATA
POINTS 12 float
-525731.0 0.0 850651.0
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
-850651.0 -525731.0 0.0
POLYGONS 20 80
3 1 4 0
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

let landmarkVtkUrl

const encoder = new TextEncoder()
const getLandmarkVtk = (action) => {

  // landmarks are array of triples in nm (array of array of numbers)
  const landmarks = action.landmarks
  const vtk = vtkHeader
    .concat('\n')
    .concat(getVertexHeader(landmarks.length))
    .concat('\n')
    .concat(landmarks.map(landmark => getIcoVertex(landmark, 2.8)).join('\n'))
    .concat('\n')
    .concat(getPolyHeader(landmarks.length))
    .concat('\n')
    .concat(landmarks.map((_, idx) => getIcoPoly(idx)).join('\n'))
    .concat('\n')
    .concat(getLabelHeader(landmarks.length))
    .concat('\n')
    .concat(landmarks.map((_, idx) => getLabelScalar(idx)).join('\n'))
  
  // when new set of landmarks are to be displayed, the old landmarks will be discarded
  if(landmarkVtkUrl)
    URL.revokeObjectURL(landmarkVtkUrl)
  landmarkVtkUrl = URL.createObjectURL(new Blob( [encoder.encode(vtk)], {type : 'application/octet-stream'} ))
  postMessage({
    type : 'ASSEMBLED_LANDMARK_VTK',
    url : landmarkVtkUrl
  })
}

onmessage = (message) => {
  
  if(validTypes.findIndex(type => type === message.data.type)>=0){
    switch(message.data.type){
      case 'CHECK_MESHES':
        checkMeshes(message.data)
        return;
      case 'GET_LANDMARK_VTK':
        getLandmarkVtk(message.data)
        return;
      default:
        console.warn('unhandled worker action')
    }
  }
}
