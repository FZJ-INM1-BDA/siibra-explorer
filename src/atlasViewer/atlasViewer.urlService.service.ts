import { Injectable } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { ViewerStateInterface, isDefined, NEWVIEWER, getLabelIndexMap, SELECT_REGIONS, CHANGE_NAVIGATION, LOAD_DEDICATED_LAYER, ADD_NG_LAYER, PluginInitManifestInterface } from "../services/stateStore.service";
import { Observable,combineLatest } from "rxjs";
import { filter, map, scan, distinctUntilChanged, takeWhile, takeLast } from "rxjs/operators";
import { getActiveColorMapFragmentMain } from "../ui/nehubaContainer/nehubaContainer.component";
import { PluginServices } from "./atlasViewer.pluginService.service";
import { AtlasViewerConstantsServices } from "./atlasViewer.constantService.service";

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
    private constantService:AtlasViewerConstantsServices
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
      takeWhile(fetchedTemplates => fetchedTemplates.length < this.constantService.templateUrls.length),
      takeLast(1),
      map(ft => ft.filter(t => t !== null))
    ).subscribe(fetchedTemplates=>{
      const searchparams = new URLSearchParams(window.location.search)
 
      /* first, check if any template and parcellations are to be loaded */
      const searchedTemplatename = searchparams.get('templateSelected')
      const searchedParcellationName = searchparams.get('parcellationSelected')
      
      const templateToLoad = fetchedTemplates.find(template=>template.name === searchedTemplatename)
      if(!templateToLoad)
        return
      const parcellationToLoad = templateToLoad ? 
        templateToLoad.parcellations.find(parcellation=>parcellation.name === searchedParcellationName) :
        templateToLoad.parcellations[0]
      
      this.store.dispatch({
        type : NEWVIEWER,
        selectTemplate : templateToLoad,
        selectParcellation : parcellationToLoad
      })

      /* selected regions */
      const labelIndexMap = getLabelIndexMap(parcellationToLoad.regions)
      const selectedRegions = searchparams.get('regionsSelected')
      if(selectedRegions){
        this.store.dispatch({
          type : SELECT_REGIONS,
          selectRegions : selectedRegions.split('_').map(labelIndex=>labelIndexMap.get(Number(labelIndex)))
        })
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
            shader : getActiveColorMapFragmentMain()
          }
        }))
      }

      const pluginStates = searchparams.get('pluginStates')
      if(pluginStates){
        const arrPluginStates = pluginStates.split('__')
        arrPluginStates.forEach(url => fetch(url).then(res => res.json()).then(json => this.pluginService.launchPlugin(json)).catch(console.error))
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
      map(([navigationState, niftiLayers, pluginState]) => Object.assign({}, navigationState, { pluginStates : Array.from(pluginState.initManifests.values()).filter(v => v !== null).length > 0 ? Array.from(pluginState.initManifests.values()).filter(v => v !== null).join('__') : null }, { niftiLayers : niftiLayers.length > 0 ? niftiLayers.map(layer => layer.name).join('__') : null }))
    ).subscribe(cleanedState=>{
      const url = new URL(window.location)
      const search = new URLSearchParams( window.location.search )
      Object.keys(cleanedState).forEach(key=>{
        cleanedState[key] ? search.set(key,cleanedState[key]) : search.delete(key)
      })

      url.search = search.toString()
      history.replaceState(null,'',url.toString())
    })
  }
}