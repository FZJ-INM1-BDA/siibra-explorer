(function(exports){
  /**
   * CM_CONST adopted from https://github.com/bpostlethwaite/colormap
   * at commit hash 3406182
   * 
   * with MIT license
   * 
   * Copyright (c) <2012> ICRL
   * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
   * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
   * 
   * https://github.com/bpostlethwaite/colormap/blob/3406182/colorScale.js
   */
  const CM_CONST = {
    "jet":[{"index":0,"rgb":[0,0,131]},{"index":0.125,"rgb":[0,60,170]},{"index":0.375,"rgb":[5,255,255]},{"index":0.625,"rgb":[255,255,0]},{"index":0.875,"rgb":[250,0,0]},{"index":1,"rgb":[128,0,0]}],
    "viridis": [{"index":0,"rgb":[68,1,84]},{"index":0.13,"rgb":[71,44,122]},{"index":0.25,"rgb":[59,81,139]},{"index":0.38,"rgb":[44,113,142]},{"index":0.5,"rgb":[33,144,141]},{"index":0.63,"rgb":[39,173,129]},{"index":0.75,"rgb":[92,200,99]},{"index":0.88,"rgb":[170,220,50]},{"index":1,"rgb":[253,231,37]}],
    "plasma": [{"index":0,"rgb":[13,8,135]},{"index":0.13,"rgb":[75,3,161]},{"index":0.25,"rgb":[125,3,168]},{"index":0.38,"rgb":[168,34,150]},{"index":0.5,"rgb":[203,70,121]},{"index":0.63,"rgb":[229,107,93]},{"index":0.75,"rgb":[248,148,65]},{"index":0.88,"rgb":[253,195,40]},{"index":1,"rgb":[240,249,33]}],
    "magma": [{"index":0,"rgb":[0,0,4]},{"index":0.13,"rgb":[28,16,68]},{"index":0.25,"rgb":[79,18,123]},{"index":0.38,"rgb":[129,37,129]},{"index":0.5,"rgb":[181,54,122]},{"index":0.63,"rgb":[229,80,100]},{"index":0.75,"rgb":[251,135,97]},{"index":0.88,"rgb":[254,194,135]},{"index":1,"rgb":[252,253,191]}],
    "inferno": [{"index":0,"rgb":[0,0,4]},{"index":0.13,"rgb":[31,12,72]},{"index":0.25,"rgb":[85,15,109]},{"index":0.38,"rgb":[136,34,106]},{"index":0.5,"rgb":[186,54,85]},{"index":0.63,"rgb":[227,89,51]},{"index":0.75,"rgb":[249,140,10]},{"index":0.88,"rgb":[249,201,50]},{"index":1,"rgb":[252,255,164]}],
    "greyscale": [{"index":0,"rgb":[0,0,0]},{"index":1,"rgb":[255,255,255]}],
  }

  function lerp(min, max, val) {
    const absDiff = max - min
    const lowerVal = (val - min) / absDiff
    return [lowerVal, 1 - lowerVal]
  }

  function getLerpToCm(colormap) {
    if (!CM_CONST[colormap]) {
      throw new Error(`colormap ${colormap} does not exist in CM_CONST`)
    }
    const cm = CM_CONST[colormap]

    function check(nv, current) {
      const lower = cm[current].index <= nv
      const higher = nv <= cm[current + 1].index
      let returnVal = null
      if (lower && higher) {
        returnVal = {
          index: nv,
          rgb: [0, 0, 0]
        }
        const [ lowerPc, higherPc ] = lerp(cm[current].index, cm[current + 1].index, nv)
        returnVal.rgb = returnVal.rgb.map((_, idx) => cm[current]['rgb'][idx] * lowerPc + cm[current + 1]['rgb'][idx] * higherPc)
      }
      return [ returnVal, { lower, higher } ]
    }
    return function lerpToCm(nv) {
      let minLow = 0, maxHigh = cm.length, current = Math.floor((maxHigh + minLow) / 2), found
      let iter = 0
      while (true) {
        iter ++
        if (iter > 100) {
          throw new Error(`iter > 1000, something we`)
        }
        const [val, { lower, higher }] = check(nv, current)
        if (val) {
          found = val
          break
        }
        if (lower) {
          minLow = current
        }
        if (higher) {
          maxHigh = current
        }
        current = Math.floor((maxHigh + minLow) / 2)
      }
      return found
    }
  }


  function unpackToArray(inputArray, width, height, channel, dtype) {
    /**
     * NB: assuming C (row major) order!
     */

    if (channel !== 1) {
      throw new Error(`cm2rgba channel must be 1, but is ${channel} instead`)
    }
    const depth = (() => {
      if (dtype === "int32") return 4
      if (dtype === "float32") return 4
      if (dtype === "uint8") return 1
      throw new Error(`unrecognised dtype: ${dtype}`)
    })()
    if (width * height * depth !== inputArray.length) {
      throw new Error(`expecting width * height * depth === input.length, but ${width} * ${height} * ${depth} === ${width * height * depth} !== ${inputArray.length}`)
    }

    const UseConstructor = (() => {

      if (dtype === "int32") return Int32Array
      if (dtype === "float32") return Float32Array
      if (dtype === "uint8") return Uint8Array
      throw new Error(`unrecognised dtype: ${dtype}`)
    })()
    
    const newArray = new UseConstructor(inputArray.buffer)
    const outputArray = []
    let min = null
    let max = null
    for (let y = 0; y < height; y ++) {
      if (!outputArray[y]) outputArray[y] = []
      for (let x = 0; x < width; x++) {
        const num = newArray[y * width + x]
        min = min === null ? num : Math.min(num, min)
        max = max === null ? num : Math.max(num, max)
        outputArray[y][x] = newArray[y * width + x]
      }
    }
    return {
      outputArray,
      min,
      max
    }
  }

  exports.typedArray = {
    fortranToRGBA(inputArray, width, height, channel) {
      if (channel !== 1 && channel !== 3) {
        throw new Error(`channel must be either 1 or 3`)
      }
      const greyScale = (channel === 1)
      const dim = width * height
      if (channel === 1 && inputArray.length !== dim) {
        throw new Error(`for single channel, expect width * height === inputArray.length, but ${width} * ${height} !== ${inputArray.length}`)
      }
      if (channel === 3 && inputArray.length !== (dim * 3)) {
        throw new Error(`for 3 channel, expect 3 * width * height === inputArray.length, but 3 * ${width} * ${height} !== ${inputArray.length}`)
      }
      const _ = new ArrayBuffer(width * height * 4)
      const buffer = new Uint8ClampedArray(_)
      for (let i = 0; i < width; i ++) {
        for (let j = 0; j < height; j ++) {
          for (let k = 0; k < 4; k ++) {
            const toIndex = (j * width + i) * 4 + k
            const fromValue = k === 3
              ? 255
              : greyScale
                ? inputArray[width * j + i]
                : inputArray[dim * k + width * j + i]
            buffer[toIndex] = fromValue
          }
        }
      }
      return buffer
    },
    cm2rgba(inputArray, width, height, channel, dtype, processParams) {
      const { 
        outputArray,
        min,
        max,
       } = unpackToArray(inputArray, width, height, channel, dtype)
      const {
        colormap="jet"
      } = processParams || {}

      const _ = new ArrayBuffer(width * height * 4)
      const buffer = new Uint8ClampedArray(_)

      const absDiff = max - min
      const lerpToCm = getLerpToCm(colormap)
      
      for (let row = 0; row < height; row ++) {
        for (let col = 0; col < width; col ++){
          const normalizedValue = (outputArray[row][col] - min) / absDiff
          const { rgb } = lerpToCm(normalizedValue)

          const toIdx = (row * width + col) * 4
          buffer[toIdx] = rgb[0]
          buffer[toIdx + 1] = rgb[1]
          buffer[toIdx + 2] = rgb[2]
          buffer[toIdx + 3] = 255
        }
      }
      return {
        buffer,
        min,
        max,
      }
    },
    rawArray(inputArray, width, height, channel, dtype) {
      const { 
        outputArray,
        min,
        max,
       } = unpackToArray(inputArray, width, height, channel, dtype)
       return {
          outputArray,
          min,
          max,
       }
    }
  }
})(
  typeof exports === 'undefined'
  ? self
  : exports
)