import { Injectable } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { ViewerStateInterface, isDefined, NEWVIEWER, getLabelIndexMap, SELECT_REGIONS, CHANGE_NAVIGATION, LOAD_DEDICATED_LAYER } from "../services/stateStore.service";
import { Observable } from "rxjs";
import { filter, map, scan, take } from "rxjs/operators";

declare var window

@Injectable({
  providedIn : 'root'
})

export class AtlasViewerURLService{
  private changeQueryObservable$ : Observable<any>
  constructor(private store : Store<ViewerStateInterface>){

    this.changeQueryObservable$ = this.store.pipe(
      select('viewerState'),
      filter(state=>
        isDefined(state) && 
        (isDefined(state.templateSelected) ||
        isDefined(state.regionsSelected) || 
        isDefined(state.navigation) || 
        isDefined(state.parcellationSelected))),

      /* map so that only a selection are serialized */
      map(({templateSelected,regionsSelected,navigation,parcellationSelected,dedicatedView})=>({
        templateSelected,
        regionsSelected,
        navigation,
        parcellationSelected,
        dedicatedView
      }))
    ).pipe(
      scan((acc,val)=>Object.assign({},acc,val),{})
    )

    this.subscriptions()
  }

  private subscriptions(){

    /* parse search url to state */
    this.store.pipe(
      select('viewerState'),
      filter(state=>isDefined(state)&&isDefined(state.fetchedTemplates)),
      map(state=>state.fetchedTemplates),
      take(1)
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

      const dedicatedView = searchparams.get('dedicatedView')
      if(dedicatedView){
        this.store.dispatch({
          type : LOAD_DEDICATED_LAYER,
          dedicatedView 
        })
      }
    })

    /* pushing state to url */
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
          }else{
            if(key === 'dedicatedView'){
              _[key] = null
            }
          }
        }
        return _
      })
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