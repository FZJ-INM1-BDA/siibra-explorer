import { Injectable } from "@angular/core";
import { UrlSegment, UrlTree } from "@angular/router";
import { map } from "rxjs/operators";
import { SAPI } from "src/atlasComponents/sapi";
import { translateV3Entities } from "src/atlasComponents/sapi/translateV3";
import { SxplrRegion } from "src/atlasComponents/sapi/sxplrTypes"
import { atlasSelection, defaultState, MainState, plugins, userInteraction } from "src/state";
import { getParcNgId } from "src/viewerModule/nehuba/config.service";
import { decodeToNumber, encodeNumber, encodeURIFull, separator } from "./cipher";
import { TUrlAtlas, TUrlPathObj, TUrlStandaloneVolume } from "./type";
import { decodePath, encodeId, decodeId, encodePath } from "./util";

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
        map(atlases => atlases.find(atlas => atlas.id === selectedAtlasId))
      ).toPromise(),
      this.sapi.v3Get("/spaces/{space_id}", {
        path: {
          space_id: selectedTemplateId
        }
      }).pipe(
        map(val => translateV3Entities.translateTemplate(val))
      ).toPromise(),
      this.sapi.v3Get("/parcellations/{parcellation_id}", {
        path: {
          parcellation_id: selectedParcellationId
        }
      }).pipe(
        map(val => translateV3Entities.translateParcellation(val))
      ).toPromise(),
      this.sapi.getParcRegions(selectedParcellationId).toPromise(),
    ])

    const userViewer = await this.sapi.useViewer(selectedTemplate).toPromise()
    
    const selectedRegions = await (async () => {
      if (!selectedRegionIds) return []

      /**
       * should account for 
       */
      const json = {}

      for (let idx = 0; idx < selectedAtlasId.length; idx += 2) {
        const stateNgId = selectedRegionIds[idx]
        if (json[stateNgId]) {
          console.warn(`ngId '${stateNgId}' appeared multiple times. Skipping. Are the label indicies been stored inefficiently?`)
          continue
        }
        json[selectedRegionIds[idx]] = selectedRegionIds[idx + 1]
      }
      
      const regionMap = new Map<string, SxplrRegion>(allParcellationRegions.map(region => [region.name, region]))
      const ngIdToRegionMap: Map<string, Map<number, SxplrRegion[]>> = new Map()

      const [ ngMap, threeMap ] = await Promise.all([
        this.sapi.getTranslatedLabelledNgMap(selectedParcellation, selectedTemplate),
        this.sapi.getTranslatedLabelledThreeMap(selectedParcellation, selectedTemplate)
      ])

      const _selectedRegions: SxplrRegion[] = []

      for (const { region } of [...Object.values(ngMap), ...Object.values(threeMap)]) {
        const actualRegion = regionMap.get(region[0].name)
        const ngId = getParcNgId(selectedAtlas, selectedTemplate, selectedParcellation, actualRegion)

        if (!json[ngId]) {
          continue
        }
        
        const labelIndicies: number[] = json[ngId].split(separator).map((n: string) => {
          try {
            return decodeToNumber(n)
          } catch (e) {
            /**
             * TODO poisonsed encoded char, send error message
             */
            return null
          }
        }).filter(v => !!v)

        _selectedRegions.push(
          ...region.
            filter(({ label }) => labelIndicies.includes(label))
            .map(({ name }) => {
              
              const actualRegion = regionMap.get(name)
              if (!actualRegion) {
                console.warn(`region name '${name}' cannot be deciphered. Skipping`)
              }
              return actualRegion
            })
            .filter(v => !!v)
        )
      }
      return _selectedRegions

    })()

    return {
      selectedAtlas,
      selectedTemplate,
      selectedParcellation,
      selectedRegions,
      allParcellationRegions, 
      userViewer
    }
  }

  async cvtRouteToState(fullPath: UrlTree) {
    const returnState: MainState = structuredClone(defaultState)
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
        const arrPluginStates: string[] = JSON.parse(pluginStates)
        if (arrPluginStates.length > 1) throw new Error(`can only initialise one plugin at a time`)
        returnState["[state.plugins]"].initManifests = {
          [plugins.INIT_MANIFEST_SRC]: arrPluginStates
        }
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

    // try to get feature
    try {
      if (returnObj.f && returnObj.f.length === 1) {
        const decodedFeatId = decodeId(returnObj.f[0])
          .replace(/~ptc~/g, '://')
          .replace(/~/g, ':')
        const feature = await this.sapi.getV3FeatureDetailWithId(decodedFeatId).toPromise()
        returnState["[state.userInteraction]"].selectedFeature = feature
      }
    } catch (e) {
      console.error(`fetching selected feature error`)
    }

    try {
      const { selectedAtlas, selectedParcellation, selectedRegions = [], selectedTemplate, allParcellationRegions, userViewer } = await this.getATPR(returnObj as TUrlPathObj<string[], TUrlAtlas<string[]>>)
      returnState["[state.atlasSelection]"].selectedAtlas = selectedAtlas
      returnState["[state.atlasSelection]"].selectedParcellation = selectedParcellation
      returnState["[state.atlasSelection]"].selectedTemplate = selectedTemplate

      returnState["[state.atlasSelection]"].selectedRegions = selectedRegions || []
      returnState["[state.atlasSelection]"].selectedParcellationAllRegions = allParcellationRegions || []
      returnState["[state.atlasSelection]"].navigation = parsedNavObj
      returnState["[state.atlasAppearance]"].useViewer = userViewer
    } catch (e) {
      // if error, show error on UI?
      console.error(`parse template, parc, region error`, e)
    }
    return returnState
  }

  async cvtStateToRoute(_state: MainState) {
    
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
    const selectedFeature = userInteraction.selectors.selectedFeature(state)

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
      const labelIndex = await this.sapi.getRegionLabelIndices(selectedTemplate, selectedParcellation, region)
      
      const ngId = getParcNgId(selectedAtlas, selectedTemplate, selectedParcellation, region)
      selectedRegionsString = `${ngId}::${encodeNumber(labelIndex, { float: false })}`
    }
    let routes: TUrlPathObj<string, TUrlAtlas<string>> | TUrlPathObj<string, TUrlStandaloneVolume<string>>
    
    routes = {
      // for atlas
      a: selectedAtlas && encodeId(selectedAtlas.id),
      // for template
      t: selectedTemplate && encodeId(selectedTemplate.id),
      // for parcellation
      p: selectedParcellation && encodeId(selectedParcellation.id),
      // for regions
      r: selectedRegionsString && encodeURIFull(selectedRegionsString),
      // nav
      ['@']: cNavString,
      // showing dataset
      f: (() => {
        return selectedFeature && encodeId(
          encodeURIFull(
            selectedFeature.id
              .replace(/:\/\//, '~ptc~')
              .replace(/:/g, '~')
          )
        )
      })()
    }
  
    /**
     * if any params needs to overwrite previosu routes, put them here
     */
    if (standaloneVolumes && Array.isArray(standaloneVolumes) && standaloneVolumes.length > 0) {
      searchParam.set('standaloneVolumes', JSON.stringify(standaloneVolumes))
      routes = {
        // nav
        ['@']: cNavString,
      } as TUrlPathObj<string, TUrlStandaloneVolume<string>>
    }

    const routesArr: string[] = []
    for (const key in routes) {
      if (!!routes[key]) {
        const segStr = encodePath(key, routes[key])
        routesArr.push(segStr)
      }
    }
  
    return searchParam.toString() === '' 
      ? routesArr.join('/')
      : `${routesArr.join('/')}?${searchParam.toString()}`
  }
}
