import { Inject, Injectable } from "@angular/core";
import { UrlSegment, UrlTree } from "@angular/router";
import { map } from "rxjs/operators";
import { SAPI } from "src/atlasComponents/sapi";
import { translateV3Entities } from "src/atlasComponents/sapi/translateV3";
import { SxplrRegion } from "src/atlasComponents/sapi/sxplrTypes"
import { atlasAppearance, atlasSelection, defaultState, MainState, plugins, userInteraction, userInterface } from "src/state";
import { decodeToNumber, encodeNumber, encodeURIFull, separator } from "./cipher";
import { TUrlAtlas, TUrlPathObj, TUrlStandaloneVolume } from "./type";
import { decodePath, encodeId, decodeId, encodePath } from "./util";
import { CachedFunction, QuickHash, decodeBool, encodeBool, mutateDeepMerge } from "src/util/fn";
import { NEHUBA_CONFIG_SERVICE_TOKEN, NehubaConfigSvc } from "src/viewerModule/nehuba/config.service";
import { INIT_ROUTE_TO_STATE } from "src/util/injectionTokens";
import { RecursivePartial } from "src/util/recursivePartial";

type ViewerConfigState = {
  panelMode: userInterface.PanelMode
  panelOrder: string
  octantRemoval: boolean
  showDelineation: boolean
}

type ViewerCfgStateV2 = {
  auxMeshAlpha: number
} & ViewerConfigState

const PANEL_MODE_DICT: Record<userInterface.PanelMode, number> = {
  "FOUR_PANEL": 1,
  "PIP_PANEL": 2,
  "H_ONE_THREE": 3,
  "V_ONE_THREE": 4,
  "SINGLE_PANEL": 5
}

const PANEL_MODE_DECODE = (() => {
  const returnVal: Record<number, userInterface.PanelMode> = {}
  for (const [key, value] of Object.entries(PANEL_MODE_DICT)) {
    returnVal[value] = key as userInterface.PanelMode
  }
  return returnVal
})()

const decodeMiscState = {
  "v1": (encodedVal: string) => {
    
    const returnVal: ViewerCfgStateV2 = {
      octantRemoval: true,
      panelMode: "FOUR_PANEL",
      panelOrder: "0123",
      showDelineation: true,
      auxMeshAlpha: 1.0
    }
    if (!encodedVal) {
      return returnVal
    }
    const array = Uint8Array.from(window.atob(encodedVal), v => v.charCodeAt(0))

    const panelModeVal = array[0]
    returnVal.panelMode = "FOUR_PANEL"
    if (panelModeVal in PANEL_MODE_DECODE) {
      returnVal.panelMode = PANEL_MODE_DECODE[panelModeVal]
    }
    let panelOrderVal = array[1]
    let panelOrder = ""
    while (panelOrder.length < 4) {
      panelOrder += `${panelOrderVal % 4}`
      panelOrderVal ++
    }
    if (
      panelOrder.split("").some(
        v => !("0123".split("")).includes(v)
      )
    ) {
      console.warn(`panelOrder=${panelOrder} contains strings that is not in 0123, set to default (0123)`)
      panelOrder = "0123"
    }
    returnVal.panelOrder = panelOrder

    const [ octantRemoval, showDelineation ] = decodeBool(array[2])
    returnVal.octantRemoval = octantRemoval
    returnVal.showDelineation = showDelineation
    
    return returnVal
  },
  "v2": (encodedVal: string) => {
    const decodedArray = []
    for (let i = 0; i < encodedVal.length; i += 2){
      decodedArray.push(
        parseInt(encodedVal.slice(i, i + 2), 16)
      )
    }
    
    const v1Arr = decodedArray.slice(1)
    const v1Str = window.btoa(new Uint8Array(v1Arr).reduce((data, v) => data + String.fromCharCode(v), ''))
    const v1State = decodeMiscState['v1'](v1Str)

    const meshAlpha = decodedArray[0] / 255

    let panelOrderVal = decodedArray[2]
    const panelOrder = []
    while (panelOrder.length < 4) {
      panelOrder.unshift(
        panelOrderVal & 3
      )
      // n.b. only store 2 bit increment
      panelOrderVal = panelOrderVal >> 2
    }
    
    const returnVal: ViewerCfgStateV2 = {
      ...v1State,
      auxMeshAlpha: meshAlpha,
      panelOrder: panelOrder.join(""),
    }
    return returnVal
  }
} as Record<string, (encodedValue: string) => ViewerCfgStateV2>

@Injectable()
export class RouteStateTransformSvc {

  static GetOneAndOnlyOne<T>(arr: T[]): T{
    if (!arr || arr.length === 0) return null
    if (arr.length > 1) throw new Error(`expecting exactly 1 item, got ${arr.length}`)
    return arr[0]
  }

  constructor(
    private sapi: SAPI,
    @Inject(NEHUBA_CONFIG_SERVICE_TOKEN)
    private nehubaCfgSvc: NehubaConfigSvc,
    @Inject(INIT_ROUTE_TO_STATE)
    private otherRouteToState: ((fullpath: string) => Promise<RecursivePartial<MainState>>)[]
  ){
  }
  
  private async getATPR(obj: TUrlPathObj<string[], TUrlAtlas<string[]>>){
    const selectedAtlasId = decodeId( RouteStateTransformSvc.GetOneAndOnlyOne(obj.a) )
    const selectedTemplateId = decodeId( RouteStateTransformSvc.GetOneAndOnlyOne(obj.t) )
    const selectedParcellationId = decodeId( RouteStateTransformSvc.GetOneAndOnlyOne(obj.p) )
    const selectedRegionIds = obj.r
    const selectedRegionNames = obj.rn
    
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
      if (!selectedRegionIds && !selectedRegionNames) return []

      if (selectedRegionNames && selectedRegionNames.length > 0) {
        return allParcellationRegions.filter(region => selectedRegionNames.includes(QuickHash.GetHash(region.name)))
      }

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

      const [ ngMap, threeMap ] = await Promise.all([
        this.sapi.getTranslatedLabelledNgMap(selectedParcellation, selectedTemplate),
        this.sapi.getTranslatedLabelledThreeMap(selectedParcellation, selectedTemplate)
      ])

      const _selectedRegions: SxplrRegion[] = []

      for (const { region } of [...Object.values(ngMap), ...Object.values(threeMap)]) {
        const actualRegion = regionMap.get(region[0].name)
        const ngId = this.nehubaCfgSvc.getParcNgId(selectedAtlas, selectedTemplate, selectedParcellation, actualRegion)

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
    const viewerConfigState = returnObj['vs'] && returnObj['vs'][0]
    if (viewerConfigState) {

      const { panelMode, panelOrder, showDelineation, octantRemoval, auxMeshAlpha } = !!viewerConfigState
      ? this.decodeMiscState(viewerConfigState)
      : { panelMode: "FOUR_PANEL" as const, panelOrder: "0123", showDelineation: true, octantRemoval: true, auxMeshAlpha: 1.0 }
  
      returnState['[state.ui]'].panelMode = panelMode
      returnState['[state.ui]'].panelOrder = panelOrder

      returnState["[state.atlasAppearance]"].showDelineation = showDelineation
      returnState["[state.atlasAppearance]"].octantRemoval = octantRemoval  
      returnState["[state.atlasAppearance]"].meshTransparency = auxMeshAlpha
  
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

    for (const fn of this.otherRouteToState){
      const partial = await fn(fullPath.toString())
      mutateDeepMerge(returnState, partial)
    }

    return returnState
  }

  public stateVersion = 'v2'

  @CachedFunction({
    serialization: (config: ViewerCfgStateV2) => {
      const { auxMeshAlpha, octantRemoval, panelMode, panelOrder, showDelineation } = config
      return `${auxMeshAlpha}.${octantRemoval}.${panelMode}.${panelOrder}.${showDelineation}`
    }
  })
  encodeMiscState(config: ViewerCfgStateV2): string {
    const { panelMode, panelOrder, octantRemoval, showDelineation, auxMeshAlpha } = config
    let panelModeVal = 1
    if (panelMode) {
      panelModeVal = PANEL_MODE_DICT[panelMode]
    }
    let panelOrderVal = 0
  
    
    // validate panelOrder
    let order = panelOrder.split("").map(v => parseInt(v))
    if (order.length !== 4 || [0,1,2,3].some(v => !order.includes(v))) {
      // if order is not of length 4, 
      // OR if the order does not contain exhaustive list 0, 1, 2, 3
      // use 0, 1, 2, 3 as default
      order = [0, 1, 2, 3]
    }
    // n.b. only store 2 bit increment
    for (const v of order){
      panelOrderVal = panelOrderVal << 2
      panelOrderVal += v
    }
    const meshAlpha = auxMeshAlpha * 255
    const encodedBools = encodeBool(octantRemoval, showDelineation)
    const array = new Uint8Array([
      meshAlpha,
      panelModeVal,
      panelOrderVal,
      encodedBools
    ])
    // btoa contains / character, which unfortunately does not work with angular routing
    // rather than escaping the character, we use hex encoding... waste some characters, but get predictable result
    const encodedVal = array.reduce((acc, num) => `${acc}${num.toString(16).padStart(2, "0")}`, "")
    return `${this.stateVersion}-${encodedVal}`
  }

  @CachedFunction()
  decodeMiscState(val: string){
    // TODO need to double check if this function should be cached.
    // 
    const [version, ...rest] = val.split("-")
    const encodedValue = rest.join("-")
    if (version in decodeMiscState) {
      return decodeMiscState[version](encodedValue)
    }
    throw new Error(`${version} not in ${Object.keys(decodeMiscState)}`)
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

    const panelMode = userInterface.selectors.panelMode(state)
    const panelOrder = userInterface.selectors.panelOrder(state)
    const octantRemoval = atlasAppearance.selectors.octantRemoval(state)
    const showDelineation = atlasAppearance.selectors.showDelineation(state)
    const auxMeshAlpha = atlasAppearance.selectors.meshTransparency(state)

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
  
    let routes: TUrlPathObj<string|string[], TUrlAtlas<string|string[]>> | TUrlPathObj<string, TUrlStandaloneVolume<string>>
    
    routes = {
      // for atlas
      a: selectedAtlas && encodeId(selectedAtlas.id),
      // for template
      t: selectedTemplate && encodeId(selectedTemplate.id),
      // for parcellation
      p: selectedParcellation && encodeId(selectedParcellation.id),
      // for regions
      // r: selectedRegionsString && encodeURIFull(selectedRegionsString),
      rn: selectedRegions[0] && selectedRegions.map(r => QuickHash.GetHash(r.name)),
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
      })(),
      vs: this.encodeMiscState({ octantRemoval, panelMode, panelOrder, showDelineation, auxMeshAlpha })
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
