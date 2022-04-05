import { Injectable } from "@angular/core";
import { UrlSegment, UrlTree } from "@angular/router";
import { map } from "rxjs/operators";
import { SAPI } from "src/atlasComponents/sapi";
import { atlasSelection, defaultState, MainState, plugins } from "src/state";
import { getParcNgId, getRegionLabelIndex } from "src/viewerModule/nehuba/config.service";
import { decodeToNumber, encodeNumber, encodeURIFull, separator } from "./cipher";
import { TUrlAtlas, TUrlPathObj, TUrlStandaloneVolume } from "./type";
import { decodePath, encodeId, decodeId, endcodePath } from "./util";

@Injectable()
export class RouteStateTransformSvc {

  static GetOneAndOnlyOne<T>(arr: T[]): T{
    if (!arr || arr.length === 0) return null
    if (arr.length > 1) throw new Error(`expecting exactly 1 item, got ${arr.length}`)
    return arr[0]
  }

  constructor(private sapi: SAPI){}
  
  private async getATPR(obj: TUrlPathObj<string[], TUrlAtlas<string[]>>){
    const selectedAtlasId = decodeId( RouteStateTransformSvc.GetOneAndOnlyOne(obj.a) )
    const selectedTemplateId = decodeId( RouteStateTransformSvc.GetOneAndOnlyOne(obj.t) )
    const selectedParcellationId = decodeId( RouteStateTransformSvc.GetOneAndOnlyOne(obj.p) )
    const selectedRegionIds = obj.r
    
    if (!selectedAtlasId || !selectedTemplateId || !selectedParcellationId) {
      return {}
    }

    const [
      selectedAtlas,
      selectedTemplate,
      selectedParcellation,
      allParcellationRegions = []
    ] = await Promise.all([
      this.sapi.atlases$.pipe(
        map(atlases => atlases.find(atlas => atlas["@id"] === selectedAtlasId))
      ).toPromise(),
      this.sapi.getSpaceDetail(selectedAtlasId, selectedTemplateId, { priority: 10 }).toPromise(),
      this.sapi.getParcDetail(selectedAtlasId, selectedParcellationId, { priority: 10 }).toPromise(),
      this.sapi.getParcRegions(selectedAtlasId, selectedParcellationId, selectedTemplateId, { priority: 10 }).toPromise(),
    ])

    const latNgIdMap = ["left hemisphere", "right hemisphere", "whole brain"].map(lat => {
      let regex: RegExp = /./
      if (lat === "left hemisphere") regex = /left/i
      if (lat === "right hemisphere") regex = /right/i
      return {
        lat,
        regex,
        ngId: getParcNgId(selectedAtlas, selectedTemplate, selectedParcellation, lat)
      }
    })
    
    const selectedRegions = (() => {
      if (!selectedRegionIds) return []
      /**
       * assuming only 1 selected region
       * if this assumption changes, iterate over array of selectedRegionIds
       */
      const json = { [selectedRegionIds[0]]: selectedRegionIds[1] }

      for (const ngId in json) {
        const matchingMap = latNgIdMap.find(ngIdMap => ngIdMap.ngId === ngId)
        if (!matchingMap) {
          console.error(`could not find matching map for ${ngId}`)
          continue
        }
        const filteredRegions = allParcellationRegions.filter(r => matchingMap.regex.test(r.name))
        
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
          /**
           * currently, only 1 region is expected to be selected at max
           * this method probably out performs creating a map
           * but with 2+ regions, creating a map would consistently be faster
           */
          for (const r of filteredRegions) {
            const idx = getRegionLabelIndex(selectedAtlas, selectedTemplate, selectedParcellation, r)
            if (idx === labelIndex) {
              return [ r ]
            }
          }
        }
      }
      return []
    })()

    return {
      selectedAtlas,
      selectedTemplate,
      selectedParcellation,
      selectedRegions,
      allParcellationRegions
    }
  }

  async cvtRouteToState(fullPath: UrlTree) {

    const returnState: MainState = defaultState
    const pathFragments: UrlSegment[] = fullPath.root.hasChildren()
      ? fullPath.root.children['primary'].segments
      : []

    const returnObj: Partial<TUrlPathObj<string[], unknown>> = {}
    for (const f of pathFragments) {
      const { key, val } = decodePath(f.path) || {}
      if (!key || !val) continue
      returnObj[key] = val
    }

    // nav obj is almost always defined, regardless if standaloneVolume or not
    const cViewerState = returnObj['@'] && returnObj['@'][0]
    let parsedNavObj: MainState['[state.atlasSelection]']['navigation']
    if (cViewerState) {
      try {
        const [ cO, cPO, cPZ, cP, cZ ] = cViewerState.split(`${separator}${separator}`)
        const o = cO.split(separator).map(s => decodeToNumber(s, {float: true}))
        const po = cPO.split(separator).map(s => decodeToNumber(s, {float: true}))
        const pz = decodeToNumber(cPZ)
        const p = cP.split(separator).map(s => decodeToNumber(s))
        const z = decodeToNumber(cZ)
        parsedNavObj = {
          orientation: o,
          perspectiveOrientation: po,
          perspectiveZoom: pz,
          position: p,
          zoom: z,
        }
      } catch (e) {
        /**
         * TODO Poisoned encoded char
         * send error message
         */
        console.error(`cannot parse navigation state`, e)
      }
    }

    // pluginState should always be defined, regardless if standalone volume or not
    const pluginStates = fullPath.queryParams['pl']
    if (pluginStates) {
      try {
        const arrPluginStates = JSON.parse(pluginStates)
        returnState["[state.plugins]"].initManifests = arrPluginStates.map(url => [plugins.INIT_MANIFEST_SRC, url] as [string, string])
      } catch (e) {
        /**
         * parsing plugin error
         */
        console.error(`parse plugin states error`, e, pluginStates)
      }
    }

    // If sv (standaloneVolume is defined)
    // only load sv in state
    // ignore all other params
    // /#/sv:%5B%22precomputed%3A%2F%2Fhttps%3A%2F%2Fobject.cscs.ch%2Fv1%2FAUTH_08c08f9f119744cbbf77e216988da3eb%2Fimgsvc-46d9d64f-bdac-418e-a41b-b7f805068c64%22%5D
    const standaloneVolumes = fullPath.queryParams['standaloneVolumes']
    try {
      const parsedArr = JSON.parse(standaloneVolumes)
      if (!Array.isArray(parsedArr)) throw new Error(`Parsed standalone volumes not of type array`)

      returnState["[state.atlasSelection]"].standAloneVolumes = parsedArr
      returnState["[state.atlasSelection]"].navigation = parsedNavObj
      return returnState
    } catch (e) {
      // if any error occurs, parse rest per normal
    }


    try {
      const { selectedAtlas, selectedParcellation, selectedRegions = [], selectedTemplate, allParcellationRegions } = await this.getATPR(returnObj as TUrlPathObj<string[], TUrlAtlas<string[]>>)
      returnState["[state.atlasSelection]"].selectedAtlas = selectedAtlas
      returnState["[state.atlasSelection]"].selectedParcellation = selectedParcellation
      returnState["[state.atlasSelection]"].selectedTemplate = selectedTemplate
      returnState["[state.atlasSelection]"].selectedRegions = selectedRegions || []
      returnState["[state.atlasSelection]"].selectedParcellationAllRegions = allParcellationRegions || []
      returnState["[state.atlasSelection]"].navigation = parsedNavObj
    } catch (e) {
      // if error, show error on UI?
      console.error(`parse template, parc, region error`, e)
    }
    return returnState
  }

  cvtStateToRoute(_state: MainState) {
    
    /**
     * need to create new references here
     * or else, the memoized selector will spit out undefined
     */
    const state:MainState = JSON.parse(JSON.stringify(_state))

    const selectedAtlas = atlasSelection.selectors.selectedAtlas(state)
    const selectedParcellation = atlasSelection.selectors.selectedParcellation(state)
    const selectedTemplate = atlasSelection.selectors.selectedTemplate(state)
    
    const selectedRegions = atlasSelection.selectors.selectedRegions(state)
    const standaloneVolumes = atlasSelection.selectors.standaloneVolumes(state)
    const navigation = atlasSelection.selectors.navigation(state)
  
    let dsPrvString: string
    const searchParam = new URLSearchParams()
  
    let cNavString: string
    if (navigation) {
      const { orientation, perspectiveOrientation, perspectiveZoom, position, zoom } = navigation
      if (orientation && perspectiveOrientation && perspectiveZoom && position && zoom) {
        cNavString = [
          orientation.map((n: number) => encodeNumber(n, {float: true})).join(separator),
          perspectiveOrientation.map(n => encodeNumber(n, {float: true})).join(separator),
          encodeNumber(Math.floor(perspectiveZoom)),
          Array.from(position).map((v: number) => Math.floor(v)).map(n => encodeNumber(n)).join(separator),
          encodeNumber(Math.floor(zoom)),
        ].join(`${separator}${separator}`)
      }
    }
  
    // encoding selected regions
    let selectedRegionsString: string
    if (selectedRegions.length === 1) {
      const region = selectedRegions[0]
      const labelIndex = getRegionLabelIndex(selectedAtlas, selectedTemplate, selectedParcellation, region)
      
      const ngId = getParcNgId(selectedAtlas, selectedTemplate, selectedParcellation, region)
      selectedRegionsString = `${ngId}::${encodeNumber(labelIndex, { float: false })}`
    }
    let routes: any
    
    routes= {
      // for atlas
      a: selectedAtlas && encodeId(selectedAtlas['@id']),
      // for template
      t: selectedTemplate && encodeId(selectedTemplate['@id']),
      // for parcellation
      p: selectedParcellation && encodeId(selectedParcellation['@id']),
      // for regions
      r: selectedRegionsString && encodeURIFull(selectedRegionsString),
      // nav
      ['@']: cNavString,
      // dataset file preview
      dsp: dsPrvString && encodeURI(dsPrvString),
    } as TUrlPathObj<string, TUrlAtlas<string>>
  
    /**
     * if any params needs to overwrite previosu routes, put them here
     */
    if (standaloneVolumes && Array.isArray(standaloneVolumes) && standaloneVolumes.length > 0) {
      searchParam.set('standaloneVolumes', JSON.stringify(standaloneVolumes))
      routes = {
        // nav
        ['@']: cNavString,
      } as TUrlPathObj<string|string[], TUrlStandaloneVolume<string[]>>
    }
  
    const routesArr: string[] = []
    for (const key in routes) {
      if (!!routes[key]) {
        const segStr = endcodePath(key, routes[key])
        routesArr.push(segStr)
      }
    }
  
    return searchParam.toString() === '' 
      ? routesArr.join('/')
      : `${routesArr.join('/')}?${searchParam.toString()}`
  }
}
