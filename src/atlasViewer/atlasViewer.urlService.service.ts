import { Injectable } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { ViewerStateInterface, isDefined, NEWVIEWER, CHANGE_NAVIGATION, ADD_NG_LAYER } from "../services/stateStore.service";
import { PluginInitManifestInterface } from 'src/services/state/pluginState.store'
import { Observable,combineLatest } from "rxjs";
import { filter, map, scan, distinctUntilChanged, skipWhile, take } from "rxjs/operators";
import { PluginServices } from "./atlasViewer.pluginService.service";
import { AtlasViewerConstantsServices, encodeNumber, separator, decodeToNumber } from "./atlasViewer.constantService.service";
import { SELECT_REGIONS_WITH_ID } from "src/services/state/viewerState.store";
import { UIService } from "src/services/uiService.service";

declare var window

@Injectable({
  providedIn : 'root'
})

export class AtlasViewerURLService{
  private changeQueryObservable$ : Observable<any>
  private additionalNgLayers$ : Observable<any>
  private pluginState$ : Observable<PluginInitManifestInterface>

  constructor(
    private store : Store<ViewerStateInterface>,
    private pluginService : PluginServices,
    private constantService:AtlasViewerConstantsServices,
    private uiService:UIService
  ){

    this.pluginState$ = this.store.pipe(
      select('pluginState'),
      distinctUntilChanged()
    )

    this.changeQueryObservable$ = this.store.pipe(
      select('viewerState'),
      filter(state=>
        isDefined(state) && 
        (isDefined(state.templateSelected) ||
        isDefined(state.regionsSelected) || 
        isDefined(state.navigation) || 
        isDefined(state.parcellationSelected))),

      /* map so that only a selection are serialized */
      map(({templateSelected,regionsSelected,navigation,parcellationSelected})=>({
        templateSelected,
        regionsSelected,
        navigation,
        parcellationSelected
      }))
    ).pipe(
      scan((acc,val)=>Object.assign({},acc,val),{})
    )

    /**
     * TODO change additionalNgLayer to id, querying node backend for actual urls
     */
    this.additionalNgLayers$ = combineLatest(
      this.changeQueryObservable$.pipe(
        select('templateSelected'),
        filter(v => !!v)
      ),
      /**
       * TODO duplicated with viewerState.loadedNgLayers ?
       */
      this.store.pipe(
        select('ngViewerState'),
        select('layers')
      )
    ).pipe(
      map(([templateSelected, layers])=>{
        const state = templateSelected.nehubaConfig.dataset.initialNgState
        /* TODO currently only parameterise nifti layer */
        return layers.filter(layer => /^nifti\:\/\//.test(layer.source) && Object.keys(state.layers).findIndex(layerName => layerName === layer.name) < 0)
      })
    )

    /* services has no ngOnInit lifecycle */
    this.subscriptions()
  }

  private subscriptions(){

    /* parse search url to state */
    this.store.pipe(
      select('viewerState'),
      filter(state=>isDefined(state)&&isDefined(state.fetchedTemplates)),
      map(state=>state.fetchedTemplates),
      skipWhile(fetchedTemplates => fetchedTemplates.length !== this.constantService.templateUrls.length),
      take(1),
      map(ft => ft.filter(t => t !== null))
    ).subscribe(fetchedTemplates=>{

      /**
       * TODO
       * consider what to do when we have ill formed search params
       * param validation?
       */
      const searchparams = new URLSearchParams(window.location.search)
 
      /* first, check if any template and parcellations are to be loaded */
      const searchedTemplatename = searchparams.get('templateSelected')
      const searchedParcellationName = searchparams.get('parcellationSelected')

      if (!searchedTemplatename) {
        const urlString = window.location.href
        /**
         * TODO think of better way of doing this
         */
        history.replaceState(null, '', urlString.split('?')[0])
        return
      }
      
      const templateToLoad = fetchedTemplates.find(template=>template.name === searchedTemplatename)
      if (!templateToLoad) {
        this.uiService.showMessage(
          this.constantService.incorrectTemplateNameSearchParam(searchedTemplatename),
          null,
          { duration: 5000 }
        )
        const urlString = window.location.href
        /**
         * TODO think of better way of doing this... maybe pushstate?
         */
        history.replaceState(null, '', urlString.split('?')[0])
        return
      }

      /**
       * TODO if search param of either template or parcellation is incorrect, wrong things are searched
       */
      const parcellationToLoad = templateToLoad.parcellations.find(parcellation=>parcellation.name === searchedParcellationName)

      if (!parcellationToLoad) {
        this.uiService.showMessage(
          this.constantService.incorrectParcellationNameSearchParam(searchedParcellationName),
          null,
          { duration: 5000 }
        )
      }
      
      this.store.dispatch({
        type : NEWVIEWER,
        selectTemplate : templateToLoad,
        selectParcellation : parcellationToLoad || templateToLoad.parcellations[0]
      })

      /* selected regions */
      if (parcellationToLoad && parcellationToLoad.regions) {
        /**
         * either or both parcellationToLoad and .regions maybe empty
         */
        /**
         * backwards compatibility
         */
        const selectedRegionsParam = searchparams.get('regionsSelected')
        if(selectedRegionsParam){
          const ids = selectedRegionsParam.split('_')

          this.store.dispatch({
            type : SELECT_REGIONS_WITH_ID,
            selectRegionIds: ids
          })
        }

        const cRegionsSelectedParam = searchparams.get('cRegionsSelected')
        if (cRegionsSelectedParam) {
          try {
            const json = JSON.parse(cRegionsSelectedParam)
  
            const selectRegionIds = []
  
            for (let ngId in json) {
              const val = json[ngId]
              const labelIndicies = val.split(separator).map(n =>{
                try{
                  return decodeToNumber(n)
                } catch (e) {
                  /**
                   * TODO poisonsed encoded char, send error message
                   */
                  return null
                }
              }).filter(v => !!v)
              for (let labelIndex of labelIndicies) {
                selectRegionIds.push(`${ngId}#${labelIndex}`)
              }
            }
  
            this.store.dispatch({
              type: SELECT_REGIONS_WITH_ID,
              selectRegionIds
            })
  
          } catch (e) {
            /**
             * parsing cRegionSelected error
             */
            console.log('parsing cRegionSelected error', e)
          }
        }
      }
      
      /* now that the parcellation is loaded, load the navigation state */
      const viewerState = searchparams.get('navigation')
      if(viewerState){
        const [o,po,pz,p,z]  = viewerState.split('__')
        this.store.dispatch({
          type : CHANGE_NAVIGATION,
          navigation : {
            orientation : o.split('_').map(n=>Number(n)),
            perspectiveOrientation : po.split('_').map(n=>Number(n)),
            perspectiveZoom : Number(pz),
            position : p.split('_').map(n=>Number(n)),
            zoom : Number(z)
          }
        })
      }

      const cViewerState = searchparams.get('cNavigation')
      if (cViewerState) {
        try {
          const [ cO, cPO, cPZ, cP, cZ ] = cViewerState.split(`${separator}${separator}`)
          const o = cO.split(separator).map(s => decodeToNumber(s, {float: true}))
          const po = cPO.split(separator).map(s => decodeToNumber(s, {float: true}))
          const pz = decodeToNumber(cPZ)
          const p = cP.split(separator).map(s => decodeToNumber(s))
          const z = decodeToNumber(cZ)
          this.store.dispatch({
            type : CHANGE_NAVIGATION,
            navigation : {
              orientation: o,
              perspectiveOrientation: po,
              perspectiveZoom: pz,
              position: p,
              zoom: z
            }
          })
        } catch (e) {
          /**
           * TODO Poisoned encoded char
           * send error message
           */
        }
      }

      const niftiLayers = searchparams.get('niftiLayers')
      if(niftiLayers){
        const layers = niftiLayers.split('__')

        layers.forEach(layer => this.store.dispatch({
          type : ADD_NG_LAYER, 
          layer : {
            name : layer,
            source : `nifti://${layer}`,
            mixability : 'nonmixable',
            shader : this.constantService.getActiveColorMapFragmentMain()
          }
        }))
      }

      const pluginStates = searchparams.get('pluginStates')
      if(pluginStates){
        const arrPluginStates = pluginStates.split('__')
        arrPluginStates.forEach(url => fetch(url).then(res => res.json()).then(json => this.pluginService.launchNewWidget(json)).catch(console.error))
      }
    })

    /* pushing state to url */
    combineLatest(
      this.changeQueryObservable$.pipe(
        map(state=>{
          let _ = {}
          for(const key in state){
            if(isDefined(state[key])){
              switch(key){
                case 'navigation':
                  if(
                    isDefined(state[key].orientation) &&
                    isDefined(state[key].perspectiveOrientation) &&
                    isDefined(state[key].perspectiveZoom) &&
                    isDefined(state[key].position) &&
                    isDefined(state[key].zoom)
                  ){
                    const {
                      orientation, 
                      perspectiveOrientation, 
                      perspectiveZoom, 
                      position, 
                      zoom
                    } = state[key]

                    _['cNavigation'] = [
                      orientation.map(n => encodeNumber(n, {float: true})).join(separator),
                      perspectiveOrientation.map(n => encodeNumber(n, {float: true})).join(separator),
                      encodeNumber(Math.floor(perspectiveZoom)),
                      Array.from(position).map((v:number) => Math.floor(v)).map(n => encodeNumber(n)).join(separator),
                      encodeNumber(Math.floor(zoom)) 
                    ].join(`${separator}${separator}`)
                    
                    _[key] = null
                  }
                  break;
                case 'regionsSelected': {
                  // _[key] = state[key].map(({ ngId, labelIndex })=> generateLabelIndexId({ ngId,labelIndex })).join('_')
                  const ngIdLabelIndexMap : Map<string, number[]> = state[key].reduce((acc, curr) => {
                    const returnMap = new Map(acc)
                    const { ngId, labelIndex } = curr
                    const existingArr = (returnMap as Map<string, number[]>).get(ngId)
                    if (existingArr) {
                      existingArr.push(labelIndex)
                    } else {
                      returnMap.set(ngId, [labelIndex])
                    }
                    return returnMap
                  }, new Map())

                  if (ngIdLabelIndexMap.size === 0) {
                    _['cRegionsSelected'] = null
                    _[key] = null
                    break;
                  }
                  
                  const returnObj = {}

                  for (let entry of ngIdLabelIndexMap) {
                    const [ ngId, labelIndicies ] = entry
                    returnObj[ngId] = labelIndicies.map(n => encodeNumber(n)).join(separator)
                  }
                  
                  _['cRegionsSelected'] = JSON.stringify(returnObj)
                  _[key] = null
                  break;
                }
                case 'templateSelected':
                case 'parcellationSelected':
                  _[key] = state[key].name
                  break;
                default:
                  _[key] = state[key]
              }
            }
          }
          return _
        })
      ),
      this.additionalNgLayers$.pipe(
        map(layers => layers
          .map(layer => layer.name)
          .filter(layername => !/^blob\:/.test(layername)))
      ),
      this.pluginState$
    ).pipe(
      /* TODO fix encoding of nifti path. if path has double underscore, this encoding will fail */
      map(([navigationState, niftiLayers, pluginState]) => {
        return {
          ...navigationState,
          pluginState: Array.from(pluginState.initManifests.values()).filter(v => v !== null).length > 0 
            ? Array.from(pluginState.initManifests.values()).filter(v => v !== null).join('__') 
            : null,
          niftiLayers : niftiLayers.length > 0
            ? niftiLayers.join('__')
            : null
        }
      })
    ).subscribe(cleanedState=>{
      const url = new URL(window.location)
      const search = new URLSearchParams( window.location.search )
      for (const key in cleanedState) {
        if (cleanedState[key]) {
          search.set(key, cleanedState[key])
        } else {
          search.delete(key)
        }
      }

      url.search = search.toString()
      history.replaceState(null, '', url.toString())
    })
  }
}