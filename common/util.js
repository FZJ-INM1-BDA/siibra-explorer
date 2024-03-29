(function(exports) {

  exports.camelToSnake = s => s.replace(/[A-Z]/g, s => `_${s.toLowerCase()}`)

  const flattenReducer = (acc, curr) => acc.concat(curr)
  exports.flattenReducer = flattenReducer

  const getIdObj = fullId => {
    if (!fullId) return null
    if (typeof fullId === 'string') {
      const re = /([a-z]{1,}\/[a-z]{1,}\/[a-z]{1,}\/v[0-9.]{1,})\/([0-9a-f-]{1,}$)/.exec(fullId)
      if (re) return { kgSchema: re[1], kgId: re[2] }
      return null
    } else {
      const { kg = {} } = fullId
      const { kgSchema , kgId } = kg
      if (!kgSchema || !kgId) return null
      return { kgSchema, kgId }
    }
  }

  const setsContain = (set1, set2) => {
    for (const el of set2){
      if (!set1.has(el)) return false
    }
    return true
  }

  const HEMISPHERE = {
    LEFT_HEMISPHERE: `left`,
    RIGHT_HEMISPHERE: `right`
  }

  exports.getRegionHemisphere = region => {
    if (!region) return null
    return (region.name && region.name.includes(' right') || (!!region.status && region.status.includes('right')))
      ? HEMISPHERE.RIGHT_HEMISPHERE
      : (region.name && region.name.includes(' left') || (!!region.status && region.status.includes('left')))
        ? HEMISPHERE.LEFT_HEMISPHERE
        : null
  }

  exports.setsContain = setsContain

  exports.setsEql = (set1, set2) => {
    if (set1.size !== set2.size) return false
    if (!setsContain(set1, set2)) return false
    if (!setsContain(set2, set1)) return false
    return true
  }

  exports.arrayOrderedEql = function arrayOrderedEql(arr1, arr2) {
    if (arr1.length !== arr2.length) return false
    for (const idx in arr1) {
      if (arr1[idx] !== arr2[idx]) return false
    }
    return true
  }

  exports.strToRgb = str => {
    if (typeof str !== 'string') throw new Error(`strToRgb input must be typeof string !`)

    let hash = 0
    // run at least 2 cycles, or else, len 1 string does not get hashed well
    for (let i = 0; i < str.length || i < 5; i++) {
      hash = str.charCodeAt(i % str.length) + ((hash << 5) - hash);
    }
    const returnV = []
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      returnV.push(value)
    }
    return returnV
  }

  exports.getUniqueRegionId = (template, parcellation, region) => {
    const templateId = template ? (template['@id'] || template['name']) : `untitled-template`
    const parcId = parcellation ? (parcellation['@id'] || parcellation['name']) : `untitled-parcellation`
    const regionId = region ? region['name'] : `untitled-region`
    return `${templateId}/${parcId}/${regionId}`
  }

  exports.getIdObj = getIdObj

  exports.getIdFromKgIdObj = kg => {
    if(kg.kgId && kg.kgSchema) {
      return `${kg.kgSchema}/${kg.kgId}`
    }
    return null
  }

  exports.getIdFromFullId = fullId => {
    const idObj = getIdObj(fullId)
    if (!idObj) return null
    const { kgSchema, kgId } = idObj
    return `${kgSchema}/${kgId}`
  }

  const getIdsObj = fullId => {
    const returnArray = []
    if (!fullId) return returnArray
    const legacyFullId = getIdObj(fullId)
    if (legacyFullId) returnArray.push(`${legacyFullId['kgSchema']}/${legacyFullId['kgId']}`)

    const { ['minds/core/parcellationregion/v1.0.0']: uniMindsParcRegScheIds} = fullId
    for (const key in uniMindsParcRegScheIds || {}) {
      returnArray.push(`minds/core/parcellationregion/v1.0.0/${key}`)
    }
    return returnArray
  }

  exports.getStringIdsFromRegion = region => {
    const { fullId, relatedAreas = [] } = region
    /**
     * other ways of getting id?
     */
    const relatedAreasId = relatedAreas
      .map(({ fullId }) => getIdsObj(fullId))
      .reduce(flattenReducer, [])
    return [
      ...getIdsObj(fullId),
      ...relatedAreasId
    ]
  }

  const defaultConfig = {
    timeout: 1000,
    retries: 3
  }

  exports.retry = async (fn, { timeout = defaultConfig.timeout, retries = defaultConfig.retries } = defaultConfig) => {
    let retryNo = 0
    while (retryNo < retries) {
      retryNo ++
      try {
        const result = await fn()
        return result
      } catch (e) {
        console.warn(`fn failed, retry after ${timeout} milliseconds`)
        await (() => new Promise(rs => setTimeout(rs, timeout)))()
      }
    }

    throw new Error(`fn failed ${retries} times. Aborting.`)
  }

  exports.race = async (fn, { timeout = defaultConfig.timeout } = {}) => {
    return Promise.race([
      fn(),
      new Promise((_rs, rj) => setTimeout(rj, timeout, `timed out: ${timeout}`))
    ])
  }

  const flattenRegions = regions => regions.concat(
    ...regions.map(region => region.children && region.children instanceof Array
      ? flattenRegions(region.children)
      : [])
  )

  exports.flattenRegions = flattenRegions

  exports.hexToRgb = hex => hex && hex.match(/[a-fA-F0-9]{2}/g).map(v => parseInt(v, 16))
  exports.rgbToHex = rgb => rgb && `#${rgb.map(color => color.toString(16).padStart(2, '0')).join("")}`
  exports.getRandomHex = (digit = 1024 * 1024 * 1024 * 1024) => Math.round(Math.random() * digit).toString(16)

  /**
   * No license defined
   * https://gist.github.com/mjackson/5311256#file-color-conversion-algorithms-js
   */
  exports.rgbToHsl = (r, g, b) => {

    r /= 255, g /= 255, b /= 255;

    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if (max == min) {
      h = s = 0; // achromatic
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }

      h /= 6;
    }

    return [ h, s, l ];
  }

  exports.verifyPositionArg = val => {
    return (
      Array.isArray(val) &&
      val.length === 3 &&
      val.every(n =>
        typeof n === 'number' &&
        !Number.isNaN(n)
      )
    )
  }

  const getPad = ({ length, pad }) => {
    if (pad.length !== 1) throw new Error(`pad needs to be precisely 1 character`)
    return input => {
      const padNum = Math.max(input.toString().length - length, 0)
      const padString = Array(padNum).fill(pad).join('')
      return `${padString}${input}`
    }
  }

  exports.getDateString = () => {
    const d = new Date()
    const pad2 = getPad({ pad: '0', length: 2 })

    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const date = d.getDate()

    const hr = d.getHours()
    const min = d.getMinutes()
    return `${year}${pad2(month)}${pad2(date)}_${pad2(hr)}${pad2(min)}`
  }

  function isVec4(input) {
    if (!Array.isArray(input)) return false
    if (input.length !== 4) return false
    return input.every(v => typeof v === "number")
  }
  function isMat4(input) {
    if (!Array.isArray(input)) return false
    if (input.length !== 4) return false
    return input.every(isVec4)
  }

  exports.isVec4 = isVec4
  exports.isMat4 = isMat4

  const cipher = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-'
  const negString = '~'

  const encodeInt = (number) => {
    if (number % 1 !== 0) { throw new Error('cannot encodeInt on a float. Ensure float flag is set') }
    if (isNaN(Number(number)) || number === null || number === Number.POSITIVE_INFINITY) { throw new Error('The input is not valid') }
  
    let residual
    let result = ''
  
    if (number < 0) {
      result += negString
      residual = Math.floor(number * -1)
    } else {
      residual = Math.floor(number)
    }
  
    /* eslint-disable-next-line no-constant-condition */
    while (true) {
      result = cipher.charAt(residual % 64) + result
      residual = Math.floor(residual / 64)
  
      if (residual === 0) {
        break
      }
    }
    return result
  }
  const decodeToInt = (encodedString) => {
    let _encodedString
    let negFlag = false
    if (encodedString.slice(-1) === negString) {
      negFlag = true
      _encodedString = encodedString.slice(0, -1)
    } else {
      _encodedString = encodedString
    }
    return (negFlag ? -1 : 1) * [..._encodedString].reduce((acc, curr) => {
      const index = cipher.indexOf(curr)
      if (index < 0) { throw new Error(`Poisoned b64 encoding ${encodedString}`) }
      return acc * 64 + index
    }, 0)
  }

  exports.sxplrNumB64Enc = {
    separator: ".",
    cipher,
    encodeNumber: (number, opts = { float: false }) => {
      const { float } = opts
      if (!float) {
        return encodeInt(number)
      } else {
        const floatArray = new Float32Array(1)
        floatArray[0] = number
        const intArray = new Uint32Array(floatArray.buffer)
        const castedInt = intArray[0]
        return encodeInt(castedInt)
      }
    },
    decodeToNumber: (encodedString, opts = { float: false }) => {
      const { float } = opts
      if (!float) {
        return decodeToInt(encodedString)
      } else {
        const _int = decodeToInt(encodedString)
        const intArray = new Uint32Array(1)
        intArray[0] = _int
        const castedFloat = new Float32Array(intArray.buffer)
        return castedFloat[0]
      }
    }
  }

  exports.floatEquality = (v1, v2, threshold) => {
    return Math.abs(v1 - v2) < threshold
  }

})(typeof exports === 'undefined' ? module.exports : exports)
