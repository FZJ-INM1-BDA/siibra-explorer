(function(exports) {

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
    LEFT_HEMISPHERE: `left hemisphere`,
    RIGHT_HEMISPHERE: `right hemisphere`
  }

  exports.getRegionHemisphere = region => {
    if (!region) return null
    return (region.name && region.name.includes('- right hemisphere') || (!!region.status && region.status.includes('right hemisphere')))
      ? HEMISPHERE.RIGHT_HEMISPHERE
      : (region.name && region.name.includes('- left hemisphere') || (!!region.status && region.status.includes('left hemisphere')))
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

  /**
   *
   * https://stackoverflow.com/a/16348977/6059235
   */
  exports.intToRgb = int => {
    if (int >= 65500) {
      return [255, 255, 255]
    }
    const str = String(int * 65535)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
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
    timeout: 5000,
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
  const flattenRegions = regions => regions.concat(
    ...regions.map(region => region.children && region.children instanceof Array
      ? flattenRegions(region.children)
      : [])
  )

  exports.flattenRegions = flattenRegions

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
})(typeof exports === 'undefined' ? module.exports : exports)
