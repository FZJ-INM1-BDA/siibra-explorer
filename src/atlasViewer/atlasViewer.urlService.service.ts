import { Injectable } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { ViewerStateInterface, isDefined, NEWVIEWER, getLabelIndexMap, SELECT_REGIONS, CHANGE_NAVIGATION, ADD_NG_LAYER } from "../services/stateStore.service";
import { PluginInitManifestInterface } from 'src/services/state/pluginState.store'
import { Observable,combineLatest } from "rxjs";
import { filter, map, scan, distinctUntilChanged, skipWhile, take } from "rxjs/operators";
import { PluginServices } from "./atlasViewer.pluginService.service";
import { AtlasViewerConstantsServices } from "./atlasViewer.constantService.service";
import { ToastService } from "src/services/toastService.service";

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
    private toastService: ToastService
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
        map(state => state.templateSelected)
      ),
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
        this.toastService.showToast(
          this.constantService.incorrectTemplateNameSearchParam(searchedTemplatename),
          {
            timeout: 5000
          }
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
        this.toastService.showToast(
          this.constantService.incorrectParcellationNameSearchParam(searchedParcellationName),
          {
            timeout: 5000
          }
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
        const labelIndexMap = getLabelIndexMap(parcellationToLoad.regions)
        const selectedRegions = searchparams.get('regionsSelected')
        if(selectedRegions){
          this.store.dispatch({
            type : SELECT_REGIONS,
            selectRegions : selectedRegions.split('_')
              .map(labelIndex=>labelIndexMap.get(Number(labelIndex)))
              .filter(region => !!region)
          })
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

      const niftiLayers = searchparams.get('niftiLayers')
      if(niftiLayers){
        const layers = niftiLayers.split('__')
        /*  */
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
                    _[key] = [
                      state[key].orientation.join('_'),
                      state[key].perspectiveOrientation.join('_'),
                      state[key].perspectiveZoom,
                      state[key].position.join('_'),
                      state[key].zoom 
                    ].join('__')
                  }
                  break;
                case 'regionsSelected':
                  _[key] = state[key].map(region=>region.labelIndex).join('_')
                  break;
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
      this.additionalNgLayers$,
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
            ? niftiLayers.map(layer => layer.name).join('__')
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