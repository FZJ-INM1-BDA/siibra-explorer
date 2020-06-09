(function(exports) {
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

  exports.getIdObj = getIdObj

  exports.getIdFromFullId = fullId => {
    const idObj = getIdObj(fullId)
    if (!idObj) return null
    const { kgSchema, kgId } = idObj
    return `${kgSchema}/${kgId}`
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
})(typeof exports === 'undefined' ? module.exports : exports)
