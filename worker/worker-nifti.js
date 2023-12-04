(function(exports){
  const DTYPE = {
    SHORT: 0,
    BYTE: 1,
    FLOAT: 2,
    DOUBLE: 3,
    INT: 4,
    LONG: 5,
  }

  const NIFTI_CONST = {
    TYPE_FLOAT64: 64,
    SPATIAL_UNITS_MASK: 0x07,
    TEMPORAL_UNITS_MASK: 0x38,
    NIFTI1_HDR_SIZE: 348,
    NIFTI2_HDR_SIZE: 540
  }

  const nifti1 = {
    datatype: {
      offset: 70,
      type: DTYPE.SHORT
    },
    dim0: {
      offset: 40,
      type: DTYPE.SHORT
    },
    dim1: {
      offset: 42,
      type: DTYPE.SHORT
    },
    dim2: {
      offset: 44,
      type: DTYPE.SHORT
    },
    dim3: {
      offset: 46,
      type: DTYPE.SHORT
    },
    dim4: {
      offset: 48,
      type: DTYPE.SHORT
    },
    dim5: {
      offset: 50,
      type: DTYPE.SHORT
    },
    xyztUnits: {
      offset: 123,
      type: DTYPE.BYTE
    },
    voxOffset: {
      offset: 108,
      type: DTYPE.FLOAT
    },
    numBitsPerVoxel: {
      offset: 72,
      type: DTYPE.SHORT
    }
  }
  
  const nifti2 = {
    datatype: {
      offset: 12,
      type: DTYPE.SHORT
    },
    dim0: {
      offset: 16,
      type: DTYPE.LONG
    },
    dim1: {
      offset: 24,
      type: DTYPE.LONG
    },
    dim2: {
      offset: 32,
      type: DTYPE.LONG
    },
    dim3: {
      offset: 40,
      type: DTYPE.LONG
    },
    dim4: {
      offset: 48,
      type: DTYPE.LONG
    },
    dim5: {
      offset: 56,
      type: DTYPE.LONG
    },
    xyztUnits: {
      offset: 500,
      type: DTYPE.INT
    },
    voxOffset: {
      offset: 168,
      type: DTYPE.LONG
    },
    numBitsPerVoxel: {
      offset: 14,
      type: DTYPE.SHORT
    }
  }

  const isNifti1 = data => {
    if (data.byteLength < 348) return false
    const buf = new DataView(data)
    return buf.getUint8(344) === 0x6E
    && buf.getUint8(345) === 0x2B
    && buf.getUint8(346) === 0x31
  }
  
  const isNifti2 = data => {
    if (data.byteLength < 348) return false
    const buf = new DataView(data)
    return buf.getUint8(4) === 0x6E
    && buf.getUint8(5) === 0x69
    && buf.getUint8(6) === 0x31
  }

  const readData = (buf, spec, le = false) => {
    const { offset, type } = spec
    if (type === DTYPE.SHORT) return buf.getInt16(offset, le)
    if (type === DTYPE.INT) return buf.getInt32(offset, le)
    if (type === DTYPE.FLOAT) return buf.getFloat32(offset, le)
    if (type === DTYPE.DOUBLE) return buf.getFloat64(offset, le)
    if (type === DTYPE.BYTE) return buf.getInt8(offset, le)
    if (type === DTYPE.LONG) {
      const ints = []
      let final = 0
      for (const i = 0; i < 8; i++) {
        ints.push(
          readData(buf, {
            offset: offset + i,
            type: DTYPE.INT
          }, le)
        )
      }
      for (const i = 0; i < 8; i++) {
        const counter = le ? i : (7 - i)
        final += ints[counter] * 256
      }
      return final
    }
    throw new Error(`Unknown type ${type}`)
  }

  const setData = (buf, spec, value, le = false) => {
    const { offset, type } = spec
    if (type === DTYPE.SHORT) return buf.setInt16(offset, value, le)
    if (type === DTYPE.INT) return buf.setInt32(offset, value, le)
    if (type === DTYPE.FLOAT) return buf.setFloat32(offset, value, le)
    if (type === DTYPE.DOUBLE) return buf.setFloat64(offset, value, le)
    if (type === DTYPE.BYTE) return buf.setInt8(offset, value, le)
    if (type === DTYPE.LONG) {
      throw new Error(`Writing to LONG not currently supported`)
    }
    throw new Error(`Unknown type ${type}`)
  }

  exports.nifti = {
    convert: buf => {
      
      const is1 = isNifti1(buf)
      const is2 = isNifti2(buf)
      if (!is1 && !is2) {
        throw new Error(`The file is not a valid nifti file`)
      }
      const warning = []

      const dict = is1
        ? nifti1
        : nifti2
      const dataView = new DataView(buf)

      let le = false

      // determine the endianness
      const expectedHdrSize = is1 ? NIFTI_CONST.NIFTI1_HDR_SIZE : NIFTI_CONST.NIFTI2_HDR_SIZE
      const hdrSize = readData(dataView, {
        type: DTYPE.INT,
        offset: 0
      }, le)
      if (hdrSize !== expectedHdrSize) le = !le

      // check datatypes
      const datatype = readData(dataView, dict.datatype, le)
      if (datatype == NIFTI_CONST.TYPE_FLOAT64) {
        throw new Error(`Float64 not currently supported.`)
      }

      // check... other headers

      const dim0 = readData(dataView, dict.dim0, le)
      const dim1 = readData(dataView, dict.dim1, le)
      const dim2 = readData(dataView, dict.dim2, le)
      const dim3 = readData(dataView, dict.dim3, le)
      const dim4 = readData(dataView, dict.dim4, le)
      const dim5 = readData(dataView, dict.dim5, le)
      if (dim0 > 3) {
        warning.push(`dim[0] was ${dim0}, set to 3 instead`)
        setData(dataView, dict.dim0, 3, le)
      }
      if (dim4 === 0) {
        warning.push(`dim[4] was 0, set to 1 instead`)
        setData(dataView, dict.dim4, 1, le)
      }
      if (dim4 > 1) {
        throw new Error(`Cannot parse time series`)
      }
      if (dim5 === 0) {
        warning.push(`dim[5] was 0, set to 1 instead`)
        setData(dataView, dict.dim5, 1, le)
      }
      if (dim5 > 1) {
        throw new Error(`cannot show nifti with dim[5] > 1`)
      }
      const xyztUnits = readData(dataView, dict.xyztUnits, le)
      const xyzUnit = xyztUnits & NIFTI_CONST.SPATIAL_UNITS_MASK
      if (xyzUnit === 0) {
        warning.push(`xyzt spatial unit not defined. Forcing to be mm.`)
        setData(dataView, dict.xyztUnits, xyztUnits + 2, le)
      }
      const voxOffset = readData(dataView, dict.voxOffset, le)
      const numBitsPerVoxel = readData(dataView, dict.numBitsPerVoxel, le)
      
      let type, increment = 0, min = null, max = null
      // INT8
      if (datatype === 256) type = DTYPE.BYTE, increment = 1
      // INT16
      if (datatype === 4) type = DTYPE.SHORT, increment = 2
      // INT32
      if (datatype === 8) type = DTYPE.INT, increment = 4
      // FLOAT32
      if (datatype === 16) type = DTYPE.FLOAT, increment = 4
      if (type) {

        const pointer = {
          offset: voxOffset,
          type
        }
        
        while (true) {
          try {
            const val = readData(dataView, pointer, le)
            if (min === null) min = val
            if (max === null) max = val
            if (val < min) min = val
            if (val > max) max = val
          } catch (e) {
            // erroring here is expected. Since we will overread the buffer.
            break
          }
          pointer.offset += increment
        }
      }

      return {
        meta: {
          min, max,
          warning
        },
        buffer: dataView.buffer
      }
    }
  }
})(
  typeof exports === 'undefined'
  ? self
  : exports
)