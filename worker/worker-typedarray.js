(function(exports){
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
    }
  }
})(
  typeof exports === 'undefined'
  ? self
  : exports
)