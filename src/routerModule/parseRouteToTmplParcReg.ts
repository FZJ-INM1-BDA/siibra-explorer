import { decodeToNumber, separator } from './cipher'

import {
  TUrlAtlas,
  TUrlPathObj,
} from './type'
import { UrlTree } from '@angular/router'
import { serializeSegment } from "src/viewerModule/nehuba/util"


export const PARSE_ERROR = {
  TEMPALTE_NOT_SET: 'TEMPALTE_NOT_SET',
  TEMPLATE_NOT_FOUND: 'TEMPLATE_NOT_FOUND',
  PARCELLATION_NOT_UPDATED: 'PARCELLATION_NOT_UPDATED',
}

export const encodeId = (id: string) => id && id.replace(/\//g, ':')
export const decodeId = (codedId: string) => codedId && codedId.replace(/:/g, '/')

export function parseSearchParamForTemplateParcellationRegion(obj: TUrlPathObj<string[], TUrlAtlas<string[]>>, fullPath: UrlTree, state: any, warnCb: (arg: string) => void) {

  /**
   * TODO if search param of either template or parcellation is incorrect, wrong things are searched
   */
  

  const templateSelected = (() => {
    const { fetchedTemplates } = state.viewerState

    const searchedId = obj.t && decodeId(obj.t[0])

    if (!searchedId) return null
    const templateToLoad = fetchedTemplates.find(template => (template['@id'] || template['fullId']) === searchedId)
    if (!templateToLoad) { throw new Error(PARSE_ERROR.TEMPLATE_NOT_FOUND) }
    return templateToLoad
  })()

  const parcellationSelected = (() => {
    if (!templateSelected) return null
    const searchedId = obj.p && decodeId(obj.p[0])

    const parcellationToLoad = templateSelected.parcellations.find(parcellation => (parcellation['@id'] || parcellation['fullId']) === searchedId)
    if (!parcellationToLoad) { 
      warnCb(`parcellation with id ${searchedId} not found... load the first parc instead`)
    }
    return parcellationToLoad || templateSelected.parcellations[0]
  })()

  /* selected regions */

  const regionsSelected = (() => {
    if (!parcellationSelected) return []

    // TODO deprecate. Fallback (defaultNgId) (should) already exist
    // if (!viewerState.parcellationSelected.updated) throw new Error(PARCELLATION_NOT_UPDATED)

    
    /**
     * either or both parcellationToLoad and .regions maybe empty
     */

    try {
      const json = obj.r
        ? { [obj.r[0]]: obj.r[1] }
        : JSON.parse(fullPath.queryParams['cRegionsSelected'] || '{}')

      const selectRegionIds = []

      for (const ngId in json) {
        const val = json[ngId]
        const labelIndicies = val.split(separator).map(n => {
          try {
            return decodeToNumber(n)
          } catch (e) {
            /**
             * TODO poisonsed encoded char, send error message
             */
            return null
          }
        }).filter(v => !!v)
        for (const labelIndex of labelIndicies) {
          selectRegionIds.push( serializeSegment(ngId, labelIndex) )
        }
      }
      return [] 
      // selectRegionIds
      //   .map(labelIndexId => {
      //     const region = getRegionFromlabelIndexId({ labelIndexId })
      //     if (!region) {
      //       // cb && cb({ type: ID_ERROR, message: `region with id ${labelIndexId} not found, and will be ignored.` })
      //     }
      //     return region
      //   })
      //   .filter(r => !!r)

    } catch (e) {
      /**
       * parsing cRegionSelected error
       */
      // cb && cb({ type: DECODE_CIPHER_ERROR, message: `parsing cRegionSelected error ${e.toString()}` })
    }
    return []
  })()

  return {
    templateSelected,
    parcellationSelected,
    regionsSelected,
  }
}
