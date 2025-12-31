/**
 * 
 * 
 * @typedef {object} ReadDataSpec
 * @property {number} offset
 * @property {number} type
 * 
 */

(function(exports){

  /**
   * Partial port of glMatrix https://github.com/toji/gl-matrix
   * MIT Licensed
   */
  const mat4 = {
    transpose(out, a) {
      // If we are transposing ourselves we can skip a few steps but have to cache some values
      if (out === a) {
        let a01 = a[1],
          a02 = a[2],
          a03 = a[3];
        let a12 = a[6],
          a13 = a[7];
        let a23 = a[11];
        out[1] = a[4];
        out[2] = a[8];
        out[3] = a[12];
        out[4] = a01;
        out[6] = a[9];
        out[7] = a[13];
        out[8] = a02;
        out[9] = a12;
        out[11] = a[14];
        out[12] = a03;
        out[13] = a13;
        out[14] = a23;
      } else {
        out[0] = a[0];
        out[1] = a[4];
        out[2] = a[8];
        out[3] = a[12];
        out[4] = a[1];
        out[5] = a[5];
        out[6] = a[9];
        out[7] = a[13];
        out[8] = a[2];
        out[9] = a[6];
        out[10] = a[10];
        out[11] = a[14];
        out[12] = a[3];
        out[13] = a[7];
        out[14] = a[11];
        out[15] = a[15];
      }
      return out;
    },
    getTranslation(out, mat){
      out[0] = mat[12];
      out[1] = mat[13];
      out[2] = mat[14];
      return out;
    },
    getScaling(out, mat){
      let m11 = mat[0];
      let m12 = mat[1];
      let m13 = mat[2];
      let m21 = mat[4];
      let m22 = mat[5];
      let m23 = mat[6];
      let m31 = mat[8];
      let m32 = mat[9];
      let m33 = mat[10];
      out[0] = Math.hypot(m11, m12, m13);
      out[1] = Math.hypot(m21, m22, m23);
      out[2] = Math.hypot(m31, m32, m33);
      return out;
    },
    getRotation(out, mat){
      let scaling = [1, 1, 1]
      this.getScaling(scaling, mat);
      let is1 = 1 / scaling[0];
      let is2 = 1 / scaling[1];
      let is3 = 1 / scaling[2];
      let sm11 = mat[0] * is1;
      let sm12 = mat[1] * is2;
      let sm13 = mat[2] * is3;
      let sm21 = mat[4] * is1;
      let sm22 = mat[5] * is2;
      let sm23 = mat[6] * is3;
      let sm31 = mat[8] * is1;
      let sm32 = mat[9] * is2;
      let sm33 = mat[10] * is3;
      let trace = sm11 + sm22 + sm33;
      let S = 0;
      if (trace > 0) {
        S = Math.sqrt(trace + 1.0) * 2;
        out[3] = 0.25 * S;
        out[0] = (sm23 - sm32) / S;
        out[1] = (sm31 - sm13) / S;
        out[2] = (sm12 - sm21) / S;
      } else if (sm11 > sm22 && sm11 > sm33) {
        S = Math.sqrt(1.0 + sm11 - sm22 - sm33) * 2;
        out[3] = (sm23 - sm32) / S;
        out[0] = 0.25 * S;
        out[1] = (sm12 + sm21) / S;
        out[2] = (sm31 + sm13) / S;
      } else if (sm22 > sm33) {
        S = Math.sqrt(1.0 + sm22 - sm11 - sm33) * 2;
        out[3] = (sm31 - sm13) / S;
        out[0] = (sm12 + sm21) / S;
        out[1] = 0.25 * S;
        out[2] = (sm23 + sm32) / S;
      } else {
        S = Math.sqrt(1.0 + sm33 - sm11 - sm22) * 2;
        out[3] = (sm12 - sm21) / S;
        out[0] = (sm31 + sm13) / S;
        out[1] = (sm23 + sm32) / S;
        out[2] = 0.25 * S;
      }
      return out;
    },
    multiply(out, a, b) {
      let a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3];
      let a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7];
      let a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11];
      let a30 = a[12],
        a31 = a[13],
        a32 = a[14],
        a33 = a[15];
      // Cache only the current line of the second matrix
      let b0 = b[0],
        b1 = b[1],
        b2 = b[2],
        b3 = b[3];
      out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
      out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
      out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
      out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
      b0 = b[4];
      b1 = b[5];
      b2 = b[6];
      b3 = b[7];
      out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
      out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
      out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
      out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
      b0 = b[8];
      b1 = b[9];
      b2 = b[10];
      b3 = b[11];
      out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
      out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
      out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
      out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
      b0 = b[12];
      b1 = b[13];
      b2 = b[14];
      b3 = b[15];
      out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
      out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
      out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
      out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
      return out;
    }
  }
  const quat = {
    multiply(out, a, b) {
      let ax = a[0],
        ay = a[1],
        az = a[2],
        aw = a[3];
      let bx = b[0],
        by = b[1],
        bz = b[2],
        bw = b[3];
      out[0] = ax * bw + aw * bx + ay * bz - az * by;
      out[1] = ay * bw + aw * by + az * bx - ax * bz;
      out[2] = az * bw + aw * bz + ax * by - ay * bx;
      out[3] = aw * bw - ax * bx - ay * by - az * bz;
      return out;
    },
    invert(out, a) {
      let a0 = a[0],
        a1 = a[1],
        a2 = a[2],
        a3 = a[3];
      let dot = a0 * a0 + a1 * a1 + a2 * a2 + a3 * a3;
      let invDot = dot ? 1.0 / dot : 0;
      // TODO: Would be faster to return [0,0,0,0] immediately if dot == 0
      out[0] = -a0 * invDot;
      out[1] = -a1 * invDot;
      out[2] = -a2 * invDot;
      out[3] = a3 * invDot;
      return out;
    }
  }
  /**
   * END partial port of glMatrix https://github.com/toji/gl-matrix
   */

  const DTYPE = {
    SHORT: 0,
    BYTE: 1,
    FLOAT: 2,
    DOUBLE: 3,
    INT: 4,
    LONG: 5,
    UNSIGNED_BYTE: 6
  }

  const BYTE_LENGTH = {
    [DTYPE.SHORT]: 2,
    [DTYPE.BYTE]: 1,
    [DTYPE.UNSIGNED_BYTE]: 1,
    [DTYPE.FLOAT]: 4,
    [DTYPE.DOUBLE]: 8,
    [DTYPE.INT]: 4,
    [DTYPE.LONG]: 8,
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
    },
    pixDims: {
      offset: 76,
      type: DTYPE.FLOAT
    },
    qformCode: {
      offset: 252,
      type: DTYPE.SHORT
    },
    sformCode: {
      offset: 254,
      type: DTYPE.SHORT
    },

    quaternB: {
      offset: 256,
      type: DTYPE.FLOAT
    },
    quaternC: {
      offset: 260,
      type: DTYPE.FLOAT
    },
    quaternD: {
      offset: 264,
      type: DTYPE.FLOAT
    },
    qoffsetX: {
      offset: 268,
      type: DTYPE.FLOAT
    },
    qoffsetY: {
      offset: 272,
      type: DTYPE.FLOAT
    },
    qoffsetZ: {
      offset: 276,
      type: DTYPE.FLOAT
    },

    srow: {
      offset: 280,
      type: DTYPE.FLOAT
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
    },
    pixDims: {
      offset: 104,
      type: DTYPE.DOUBLE
    },
    qformCode: {
      offset: 344,
      type: DTYPE.SHORT
    },
    sformCode: {
      offset: 348,
      type: DTYPE.SHORT
    },
    
    
    quaternB: {
      offset: 352,
      type: DTYPE.DOUBLE
    },
    quaternC: {
      offset: 360,
      type: DTYPE.DOUBLE
    },
    quaternD: {
      offset: 368,
      type: DTYPE.DOUBLE
    },
    qoffsetX: {
      offset: 376,
      type: DTYPE.DOUBLE
    },
    qoffsetY: {
      offset: 384,
      type: DTYPE.DOUBLE
    },
    qoffsetZ: {
      offset: 392,
      type: DTYPE.DOUBLE
    },
    srow: {
      offset: 400,
      type: DTYPE.DOUBLE
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

  /**
   * 
   * @param {DataView} buf 
   * @param {ReadDataSpec} spec 
   * @param {boolean} le 
   * @returns {number}
   */
  const readData = (buf, spec, le = false) => {
    const { offset, type } = spec
    if (type === DTYPE.SHORT) return buf.getInt16(offset, le)
    if (type === DTYPE.INT) return buf.getInt32(offset, le)
    if (type === DTYPE.FLOAT) return buf.getFloat32(offset, le)
    if (type === DTYPE.DOUBLE) return buf.getFloat64(offset, le)
    if (type === DTYPE.BYTE) return buf.getInt8(offset, le)
    if (type === DTYPE.UNSIGNED_BYTE) return buf.getUint8(offset, le)
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

  /**
   * 
   * @param {DataView} buf dataview
   * @param {ReadDataSpec} spec Offset & datatype
   * @param {number} value Value to set
   * @param {boolean} le Endianness
   * @returns {void}
   */
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
      
      const qformCode = readData(dataView, dict.qformCode, le)
      const sformCode = readData(dataView, dict.sformCode, le)

      if (qformCode === 0) {
        const pixDims0 = readData(dataView, dict.pixDims, le)
        const step = BYTE_LENGTH[dict.srow.type]
        const affine = []
        for (let ctrOut = 0; ctrOut < 3; ctrOut += 1) {
          for (let ctrIn = 0; ctrIn < 4; ctrIn += 1) {
            index = dict.srow.offset + (ctrOut * step + ctrIn) * step;
            affine.push(
              readData(dataView, {
                offset: index,
                type: dict.srow.type,
              }, le)
            )
          }
        }
        affine.push(0, 0, 0, 1)
        mat4.transpose(affine, affine)
        if (pixDims0 === -1) {
          mat4.multiply(affine, affine,
            [1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, -1, 0,
            0, 0, 0, 1])
        }
        
        const q = [0, 0, 0, 1]
        mat4.getRotation(q, affine)

        const translation = [0, 0, 0]
        mat4.getTranslation(translation, affine)

        setData(dataView, dict.quaternB, q[0], le)
        setData(dataView, dict.quaternC, q[1], le)
        setData(dataView, dict.quaternD, q[2], le)
        
        setData(dataView, dict.qoffsetX, translation[0], le)
        setData(dataView, dict.qoffsetY, translation[1], le)
        setData(dataView, dict.qoffsetZ, translation[2], le)

        setData(dataView, dict.qformCode, 2, le)

        warning.push(`qform not set. populated with sform affine.`)
      }
      
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
      
      if (datatype === 2) type = DTYPE.UNSIGNED_BYTE, increment = 1
      // INT8
      if (datatype === 256) type = DTYPE.BYTE, increment = 1
      // INT16
      if (datatype === 4) type = DTYPE.SHORT, increment = 2
      // UINT16 technically dodgy
      if (datatype === 512) type = DTYPE.SHORT, increment = 2
      // INT32
      if (datatype === 8) type = DTYPE.INT, increment = 4
      // UINT32 # technically dodgy
      if (datatype === 768) type = DTYPE.INT, increment = 4
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

      // shader will call toNormalized
      // so int/uint will need to return min/max normalized as well
      if (type === DTYPE.BYTE) {
        max /= 254
        min /= 254
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