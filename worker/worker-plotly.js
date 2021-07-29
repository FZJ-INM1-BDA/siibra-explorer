(function(exports){
  /**
   * units in mm --> convert to nm
   */
  const plotyMultiple = 1e6
  const { vtkHeader } = globalThis.constants || {}

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

  exports.plotly = {
    plotyMultiple,
    convert: plotlyData => {
      const { x, y, z } = plotlyData.traces[0]
      const lm = []
      for (const idx in x) {
        if (typeof x !== 'undefined' && x !== null) {
          lm.push([x[idx]*plotyMultiple, y[idx]*plotyMultiple, z[idx]*plotyMultiple])
        }
      }
      const { vtkString, customFragmentColor } = parseLineDataToVtk(plotlyData.traces[0], 5e-3, plotyMultiple)

      return {
        vtkString,
        customFragmentColor,
      }
    }
  }
})(
  typeof exports === 'undefined'
  ? self
  : exports
)
