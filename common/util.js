(function(exports) {
  exports.getIdFromFullId = fullId => {
    if (!fullId) return null
    if (typeof fullId === 'string') {
      const re = /\/([a-z]{1,}\/[a-z]{1,}\/[a-z]{1,}\/v[0-9.]{1,}\/[0-9a-z-]{1,}$)/.exec(fullId)
      if (re) return re[1]
      return null
    } else {
      const { kg = {} } = fullId
      const { kgSchema , kgId } = kg
      if (!kgSchema || !kgId) return null
      return `${kgSchema}/${kgId}`
    }
  }
})(typeof exports === 'undefined' ? module.exports : exports)
