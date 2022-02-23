const vtkHeader = `# vtk DataFile Version 2.0
Created by worker thread at https://github.com/HumanBrainProject/interactive-viewer
ASCII
DATASET POLYDATA`

globalThis.constants = {
  vtkHeader
}

if (typeof self.importScripts === 'function')  self.importScripts('./worker-plotly.js')
if (typeof self.importScripts === 'function')  self.importScripts('./worker-nifti.js')
if (typeof self.importScripts === 'function')  self.importScripts('./worker-typedarray.js')

/**
 * TODO migrate processing functionalities to other scripts
 * see worker-plotly.js
 */

const validTypes = [
  'GET_USERLANDMARKS_VTK',
  'PROPAGATE_PARC_REGION_ATTR'
]

const VALID_METHOD = {
  PROCESS_PLOTLY: `PROCESS_PLOTLY`,
  PROCESS_NIFTI: 'PROCESS_NIFTI',
  PROCESS_TYPED_ARRAY: `PROCESS_TYPED_ARRAY`,
}

const VALID_METHODS = [
  VALID_METHOD.PROCESS_PLOTLY,
  VALID_METHOD.PROCESS_NIFTI,
  VALID_METHOD.PROCESS_TYPED_ARRAY,
]

const validOutType = [
  'ASSEMBLED_USERLANDMARKS_VTK',
]

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
    if(curr === null) return acc
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
  if(!vtk) return

  if(userLandmarkVtkUrl)
    URL.revokeObjectURL(userLandmarkVtkUrl)

  userLandmarkVtkUrl = URL.createObjectURL(new Blob( [encoder.encode(vtk)], {type : 'application/octet-stream'} ))
  postMessage({
    type : 'ASSEMBLED_USERLANDMARKS_VTK',
    url : userLandmarkVtkUrl
  })
}

let plotyVtkUrl

onmessage = (message) => {
  // in dev environment, webpack ok is sent
  if (message.data.type === 'webpackOk') return

  if (message.data.method && VALID_METHODS.indexOf(message.data.method) >= 0) {
    const { id } = message.data
    if (message.data.method === VALID_METHOD.PROCESS_PLOTLY) {
      try {
        if (plotyVtkUrl) URL.revokeObjectURL(plotyVtkUrl)
        const { data: plotlyData } = message.data.param
        const {
          vtkString,
          customFragmentColor
        } = self.plotly.convert(plotlyData)
        const plotyVtkUrl = URL.createObjectURL(
          new Blob([ encoder.encode(vtkString) ], { type: 'application/octet-stream' })
        )
        postMessage({
          id,
          result: {
            objectUrl: plotyVtkUrl,
            customFragmentColor
          }
        })
      } catch (e) {
        postMessage({
          id,
          error: {
            code: 401,
            message: `malformed plotly param: ${e.toString()}`
          }
        })
      }
    }

    if (message.data.method === VALID_METHOD.PROCESS_NIFTI) {
      try {
        const { nifti } = message.data.param
        const {
          meta,
          buffer
        } = self.nifti.convert(nifti)

        postMessage({
          id,
          result: {
            meta,
            buffer
          }
        }, [ buffer ])
      } catch (e) {
        postMessage({
          id,
          error: {
            code: 401,
            message: `nifti error: ${e.toString()}`
          }
        })
      }
    }
    if (message.data.method === VALID_METHOD.PROCESS_TYPED_ARRAY) {
      try {
        const { inputArray, width, height, channel } = message.data.param
        const buffer = self.typedArray.fortranToRGBA(inputArray, width, height, channel)

        postMessage({
          id,
          result: {
            buffer
          }
        }, [ buffer.buffer ])
      } catch (e) {
        postMessage({
          id,
          error: {
            code: 401,
            message: `process typed array error: ${e.toString()}`
          }
        })
      }
    }
    postMessage({
      id,
      error: {
        code: 404,
        message: `worker method not found`
      }
    })
    return
  }

  if(validTypes.findIndex(type => type === message.data.type) >= 0){
    switch(message.data.type){
      case 'GET_USERLANDMARKS_VTK':
        getuserLandmarksVtk(message.data)
        return
      default:
        console.warn('unhandled worker action', message)
    }
  } else {
    console.warn('unhandled worker action', message)
  }
}
