const validTypes = [
  'GET_LANDMARKS_VTK',
  'GET_USERLANDMARKS_VTK',
  'BUILD_REGION_SELECTION_TREE',
  'PROPAGATE_PARC_REGION_ATTR'
]

const VALID_METHOD = {
  PROCESS_PLOTLY: `PROCESS_PLOTLY`
}

const VALID_METHODS = [
  VALID_METHOD.PROCESS_PLOTLY
]

const validOutType = [
  'ASSEMBLED_LANDMARKS_VTK',
  'ASSEMBLED_USERLANDMARKS_VTK',
  'RETURN_REBUILT_REGION_SELECTION_TREE',
  'UPDATE_PARCELLATION_REGIONS'
]

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

let landmarkVtkUrl

const getLandmarksVtk = (action) => {

  // landmarks are array of triples in nm (array of array of numbers)
  const landmarks = action.landmarks
  const template = action.template
  const scale = action.scale
    ? action.scale
    : 2.8

  const vtk = parseLmToVtk(landmarks, scale)

  if(!vtk) return

  // when new set of landmarks are to be displayed, the old landmarks will be discarded
  if(landmarkVtkUrl) URL.revokeObjectURL(landmarkVtkUrl)

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
  if(!vtk) return

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
const recursivePropagateAttri = (region, inheritAttrsOpts) => {

  const inheritAttrs = Object.keys(inheritAttrsOpts)

  const returnRegion = {
    ...region
  }
  const newInhAttrsOpts = {}
  for (const attr of inheritAttrs){
    returnRegion[attr] = returnRegion[attr] || inheritAttrsOpts[attr]
    newInhAttrsOpts[attr] = returnRegion[attr] || inheritAttrsOpts[attr]
  }
  returnRegion.children = returnRegion.children && Array.isArray(returnRegion.children)
    ? returnRegion.children.map(c => recursivePropagateAttri(c, newInhAttrsOpts))
    : null
  return returnRegion
}

const propagateAttri = (parcellation, inheritAttrsOpts) => {
  const inheritAttrs = Object.keys(inheritAttrsOpts)
  if (inheritAttrs.indexOf('children') >= 0) throw new Error(`children attr cannot be inherited`)

  const regions = Array.isArray(parcellation.regions)
    ? parcellation.regions.map(r => recursivePropagateAttri(r, inheritAttrsOpts))
    : []

  return {
    ...parcellation,
    regions
  }
}

const processParcRegionAttr = (payload) => {
  const { parcellation, inheritAttrsOpts } = payload
  const p = propagateAttri(parcellation, inheritAttrsOpts)
  postMessage({
    ...payload,
    type: 'UPDATE_PARCELLATION_REGIONS',
    parcellation: p
  })
}

const parseLineDataToVtk = (data, scale= 1, plotyMultiple) => {
  const lineCoordinates = []
  const colors = []

  for (let i = 1; i < data.x.length; i++) {

    if (data.x[i] !== null && data.x[i-1] !== null) {
      lineCoordinates.push([[
        data.x[i-1] * plotyMultiple,
        data.y[i-1] * plotyMultiple,
        data.z[i-1] * plotyMultiple,
      ], [
        data.x[i] * plotyMultiple,
        data.y[i] * plotyMultiple,
        data.z[i] * plotyMultiple,
      ]])

      colors.push(data.marker.color[i-1])
    }
  }

  const coordinateLength = lineCoordinates.length

  const lineCoordinatesArrayToString = (() => {
    let returnString = ''
    lineCoordinates.forEach(lc => {
      returnString += getPerpendicularPointsForLine(lc[0], lc[1], scale)
    })
    return returnString
  })()

  const customFragmentColor = getFragmentColorString(colors)

  const vtkString = `${vtkHeader}\n` +
    `POINTS ${coordinateLength*8} float\n` +
    lineCoordinatesArrayToString +
    `POLYGONS ${coordinateLength*12} ${coordinateLength*48}\n` +
    getLineDataVtkPolygonStringWithNumber(coordinateLength) +
    `POINT_DATA ${coordinateLength*8}\n` +
    'SCALARS label unsigned_char 1\n' +
    'LOOKUP_TABLE none\n' +
    getColorIds(colors)

  return {vtkString, customFragmentColor}
}

const getFragmentColorString = (colors) => {

  const hexToRgb = (hex) => {
    const [r, g, b] = hex.match(/\w\w/g).map(x => parseInt(x, 16))
    return `emitRGB(vec3(${r/255}, ${g/255}, ${b/255}))`
  }

  const colorsUnique = colors.filter((cf, i) => colors[i-1] !== cf)
    .map((color, j) => {
      return `if (label > ${j - 0.01} && label < ${j + 0.01}) { ${hexToRgb(color)}; }`
    })

  const fragmentColorString = `${colorsUnique.join(' else ')} else {emitRGB(vec3(1.0, 0.1, 0.12));}`
  return fragmentColorString
}

const getColorIds = (colors) => {
  let returnString = ''

  let colorId = 0

  for (let i=0; i < colors.length; i++){
    if (i > 0 && colors[i] !== colors[i-1]) {
      colorId += 1
    }
    for (let j=0; j < 8; j++){
      if (i === colors.length-1 && j === 7) {
        returnString += colorId
      } else {
        returnString += colorId + '\n'
      }
    }
  }

  return returnString
}

const getLineDataVtkPolygonStringWithNumber = (neuronCoordinateLength) => {
  let returnString = ''
  for (let i = 0; i < neuronCoordinateLength; i++) {
    const neuronNumber = 8*i
    returnString +=
      `3 ${0 + neuronNumber} ${1 + neuronNumber} ${3 + neuronNumber}\n` +
      `3 ${0 + neuronNumber} ${2 + neuronNumber} ${3 + neuronNumber}\n` +
      `3 ${4 + neuronNumber} ${5 + neuronNumber} ${7 + neuronNumber}\n` +
      `3 ${4 + neuronNumber} ${6 + neuronNumber} ${7 + neuronNumber}\n` +
      `3 ${2 + neuronNumber} ${6 + neuronNumber} ${7 + neuronNumber}\n` +
      `3 ${2 + neuronNumber} ${3 + neuronNumber} ${7 + neuronNumber}\n` +
      `3 ${3 + neuronNumber} ${1 + neuronNumber} ${7 + neuronNumber}\n` +
      `3 ${1 + neuronNumber} ${5 + neuronNumber} ${7 + neuronNumber}\n` +
      `3 ${2 + neuronNumber} ${0 + neuronNumber} ${6 + neuronNumber}\n` +
      `3 ${0 + neuronNumber} ${4 + neuronNumber} ${6 + neuronNumber}\n` +
      `3 ${1 + neuronNumber} ${0 + neuronNumber} ${4 + neuronNumber}\n` +
      `3 ${1 + neuronNumber} ${4 + neuronNumber} ${5 + neuronNumber}\n`
  }
  return returnString
}

const getPerpendicularPointsForLine = (A, B, scale) => {

  const lineWeight = 1e6
  const lineWidth = scale * lineWeight
  const lineHeight = scale * lineWeight

  let u = A.map((item, index) => {
    return item - B[index];
  })
  const uLength = Math.sqrt((u[0] * u[0]) + (u[1] * u[1]) + (u[2] * u[2]))
  u = u.map((item, index) => {
    return item/uLength
  })

  const n = []
  if(Math.abs(u[0]) <= Math.abs(u[1]) && Math.abs(u[0]) <= Math.abs(u[2])) {
    n[0] = u[1] * u[1] + u[2] * u[2]
    n[1] = -u[1] * u[0]
    n[2] = -u[2] * u[0]
  }
  else if(Math.abs(u[1])<=Math.abs(u[0])&&Math.abs(u[1])<=Math.abs(u[2]))
  {
    n[0] = -u[0] * u[2]
    n[1] = u[0] * u[0] + u[2] * u[2]
    n[2] = -u[2] * u[1]
  }
  else if(Math.abs(u[2])<=Math.abs(u[0])&&Math.abs(u[2])<=Math.abs(u[1]))
  {
    n[0] = -u[0] * u[2]
    n[1] = -u[1] * u[2]
    n[2] = u[0] * u[0] + u[1] * u[1]
  }

  const v = [ u[1] * n[2] - u[2] * n[1], u[2] * n[0] - u[0] * n[2], u[0] * n[1] - u[1] * n[0] ]

  const RMul = (k) => {
    const res = []
    res[0] = v[0]*k[0] + n[0]*k[1] + u[0]*k[2]
    res[1] = v[1]*k[0] + n[1]*k[1] + u[1]*k[2]
    res[2] = v[2]*k[0] + n[2]*k[1] + u[2]*k[2]
    return res
  }

  const sumArrays = (a1, a2) => {
    return a1.map((item, index) => {
      return item + a2[index];
    })
  }

  const a = sumArrays(A, RMul([lineWidth,lineHeight,0]))
  const b = sumArrays(A, RMul([-lineWidth,lineHeight,0]))
  const c = sumArrays(A, RMul([lineWidth,-lineHeight,0]))
  const d = sumArrays(A, RMul([-lineWidth,-lineHeight,0]))

  const e = sumArrays(B, RMul([lineWidth,lineHeight,0]))
  const f = sumArrays(B, RMul([-lineWidth,lineHeight,0]))
  const g = sumArrays(B, RMul([lineWidth,-lineHeight,0]))
  const h = sumArrays(B, RMul([-lineWidth,-lineHeight,0]))

  return `${a.join(' ')}\n ${b.join(' ')}\n ${c.join(' ')}\n ${d.join(' ')}\n ${e.join(' ')}\n ${f.join(' ')}\n ${g.join(' ')}\n ${h.join(' ')}\n `
}


let plotyVtkUrl

onmessage = (message) => {
  if (message.data.method && VALID_METHODS.indexOf(message.data.method) >= 0) {
    const { id } = message.data
    if (message.data.method === VALID_METHOD.PROCESS_PLOTLY) {
      /**
       * units in mm --> convert to nm
       */
      const plotyMultiple=1e6
      try {
        const { data: plotlyData } = message.data.param
        const { x, y, z } = plotlyData.traces[0]
        const lm = []
        for (const idx in x) {
          if (typeof x !== 'undefined' && x !== null) {
            lm.push([x[idx]*plotyMultiple, y[idx]*plotyMultiple, z[idx]*plotyMultiple])
          }
        }
        if (plotyVtkUrl) URL.revokeObjectURL(plotyVtkUrl)
        const { vtkString, customFragmentColor} = parseLineDataToVtk(plotlyData.traces[0], 5e-3, plotyMultiple)

        plotyVtkUrl = URL.createObjectURL(
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
      case 'GET_LANDMARKS_VTK':
        getLandmarksVtk(message.data)
        return
      case 'GET_USERLANDMARKS_VTK':
        getuserLandmarksVtk(message.data)
        return
      case 'BUILD_REGION_SELECTION_TREE':
        rebuildSelectedRegion(message.data)
        return
      case 'PROPAGATE_PARC_REGION_ATTR':
        processParcRegionAttr(message.data)
        return
      default:
        console.warn('unhandled worker action', message)
    }
  } else {
    console.warn('unhandled worker action', message)
  }
}
