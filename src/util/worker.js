const validTypes = ['CHECK_MESHES', 'GET_LANDMARKS_VTK']
const validOutType = ['CHECKED_MESH', 'ASSEMBLED_LANDMARKS_VTK']

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

let landmarkVtkUrl

const encoder = new TextEncoder()
const getLandmarksVtk = (action) => {

  // landmarks are array of triples in nm (array of array of numbers)
  const landmarks = action.landmarks

  const reduce = landmarks.reduce((acc,curr,idx) => {
    //curr : null | [number,number,number] | [ [number,number,number], [number,number,number], [number,number,number] ][]
    if(curr === null)
      return acc
    if(!isNaN(curr[0]))
      return {
        currentVertexIndex : acc.currentVertexIndex + 12,
        vertexString : acc.vertexString.concat(getIcoVertex(curr, 2.8)),
        polyCount : acc.polyCount + 20,
        polyString : acc.polyString.concat(getIcoPoly(acc.currentVertexIndex)),
        labelString : acc.labelString.concat(Array(12).fill(idx.toString()).join('\n'))
      }
    else{
      //curr[0] : [number,number,number][] vertices
      //curr[1] : [number,number,number][] indices for the vertices that poly forms
      
      const vertices = curr[0]
      const polyIndices = curr[1]

      return {
        currentVertexIndex : acc.currentVertexIndex + vertices.length,
        vertexString : acc.vertexString.concat(getMeshVertex(vertices)),
        polyCount : acc.currentVertexIndex + polyIndices.length,
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
    return

  const vtk = vtkHeader
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
  
  // when new set of landmarks are to be displayed, the old landmarks will be discarded
  if(landmarkVtkUrl)
    URL.revokeObjectURL(landmarkVtkUrl)

  landmarkVtkUrl = URL.createObjectURL(new Blob( [encoder.encode(vtk)], {type : 'application/octet-stream'} ))
  postMessage({
    type : 'ASSEMBLED_LANDMARKS_VTK',
    url : landmarkVtkUrl
  })
}

onmessage = (message) => {
  
  if(validTypes.findIndex(type => type === message.data.type)>=0){
    switch(message.data.type){
      case 'CHECK_MESHES':
        checkMeshes(message.data)
        return
      case 'GET_LANDMARKS_VTK':
        getLandmarksVtk(message.data)
        return
      default:
        console.warn('unhandled worker action', message)
    }
  }
}
