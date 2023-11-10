/**
 * @typedef SxplrRegionPartial
 * @type {object}
 * @property {Array.<string>} parentIds
 * @property {string} name
 * @property {string} id
 */

(function(exports){
  const FUSE = 100
  /**
   * 
   * @param {Array.<SxplrRegionPartial>} regions 
   * @returns {Array.<SxplrRegionPartial>}
   */
  function findDup(regions){
    return regions.filter(region => regions.filter(r => region.name === r.name).length > 1)
  }

  exports.filterRegion = {
    /**
     * 
     * @param {Array.<SxplrRegionPartial>} regions 
     * @param {string} searchTerm 
     * @returns 
     */
    filterRegion(regions, searchTerm){
      const dups = findDup(regions)
      if (!searchTerm) return {regions, dups}

      const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')

      /**
       * 
       * @param {SxplrRegionPartial} region 
       * @param {string} searchTerm 
       * @returns {boolean}
       */
      function filterRegionName(region){
        return regex.test(region.name)
      }

      /**
       * 
       * @param {SxplrRegionPartial} parent 
       * @returns {Array.<SxplrRegionPartial>}
       */
      function getChildren(parent){
        return regions.filter(r => r.parentIds.includes(parent.id))
      }
      /**
       * 
       * @param {SxplrRegionPartial} parent 
       * @returns {Array.<SxplrRegionPartial>}
       */
      function getParent(child){
        return regions.filter(r => child.parentIds.includes(r.id))
      }
      /**
       * 
       * @param {SxplrRegionPartial} item 
       * @returns {boolean}
       */
      const transformSingle = (item) => {
        const allParents = []
        const allChildren = []
        let currItemParents = [item]
        let currItemChildren = [item]
        let breakParent = false
        let breakChildren = false
        let iter = 0
        // eslint-disable-next-line no-constant-condition
        while (true) {
          iter ++
          if (iter > FUSE || (breakParent && breakChildren)) {
            break
          }
          if (!breakParent) {
            const parents = currItemParents.map(getParent).flatMap(v => v)
            if (parents.length === 0) {
              breakParent = true
            }
            currItemParents = parents
            allParents.push(...currItemParents)
          }
          if (!breakChildren) {
            const children = currItemChildren.map(getChildren).flatMap(v => v)
            if (children.length === 0) {
              breakChildren = true
            }
            currItemChildren = children
            allChildren.push(...currItemChildren)
          }
        }
        return (
          // if self is filtered true
          filterRegionName(item)
          // if any children is filtered true
          || allChildren.some(filterRegionName)
          // if any parent is filtered true
          || allParents.some(filterRegionName)
        )
      }
        
      const filteredRegions = regions
        ? regions.filter(transformSingle)
        : []
      return { regions: filteredRegions, dups }
    }
  }
})(typeof exports === 'undefined' ? self : exports)
