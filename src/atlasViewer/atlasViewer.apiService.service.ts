import { Injectable } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { ViewerStateInterface, safeFilter } from "../services/stateStore.service";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

declare var window

@Injectable({
  providedIn : 'root'
})

export class AtlasViewerAPIServices{

  private loadedTemplates$ : Observable<any>
  public interactiveViewer : InteractiveViewerInterface

  public loadedLibraries : Map<string,{counter:number,src:HTMLElement|null}> = new Map()

  constructor(
    private store : Store<ViewerStateInterface>
  ){

    this.loadedTemplates$ = this.store.pipe(
      select('viewerState'),
      safeFilter('fetchedTemplates'),
      map(state=>state.fetchedTemplates)
    )

    this.interactiveViewer = {
      metadata : {
        selectedTemplateBSubject : this.store.pipe(
          select('viewerState'),
          safeFilter('templateSelected'),
          map(state=>state.templateSelected)),

        selectedParcellationBSubject : this.store.pipe(
          select('viewerState'),
          safeFilter('parcellationSelected'),
          map(state=>state.parcellationSelected)),

        selectedRegionsBSubject : this.store.pipe(
          select('viewerState'),
          safeFilter('regionsSelected'),
          map(state=>state.regionsSelected)),

        loadedTemplates : [],

        regionsLabelIndexMap : new Map(),

        datasetsBSubject : this.store.pipe(
          select('dataStore'),
          safeFilter('fetchedDataEntries'),
          map(state=>state.fetchedDataEntries)
        )
      },
      uiHandle : {},
      pluginControl : {
        loadExternalLibraries : ()=>Promise.reject('load External Library method not over written')
        ,
        unloadExternalLibraries : ()=>{
          console.warn('unloadExternalLibrary method not overwritten by atlasviewer')
        }
      }
    }
    window['interactiveViewer'] = this.interactiveViewer
    this.init()
  }

  private init(){
    this.loadedTemplates$.subscribe(templates=>this.interactiveViewer.metadata.loadedTemplates = templates)
  }
}

export interface InteractiveViewerInterface{

  metadata : {
    selectedTemplateBSubject : Observable<any|null>
    selectedParcellationBSubject : Observable<any|null>
    selectedRegionsBSubject : Observable<any[]|null>
    loadedTemplates : any[]
    regionsLabelIndexMap : Map<number,any> | null
    datasetsBSubject : Observable<any[]>
  },

  viewerHandle? : {
    setNavigationLoc : (coordinates:[number,number,number],realSpace?:boolean)=>void
    moveToNavigationLoc : (coordinates:[number,number,number],realSpace?:boolean)=>void
    setNavigationOri : (quat:[number,number,number,number])=>void
    moveToNavigationOri : (quat:[number,number,number,number])=>void
    showSegment : (labelIndex : number)=>void
    hideSegment : (labelIndex : number)=>void
    showAllSegments : ()=>void
    hideAllSegments : ()=>void
    segmentColourMap : Map<number,{red:number,green:number,blue:number}>
    applyColourMap : (newColourMap : Map<number,{red:number,green:number,blue:number}>)=>void
    loadLayer : (layerobj:NGLayerObj)=>NGLayerObj
    removeLayer : (condition:{name : string | RegExp})=>string[]
    setLayerVisibility : (condition:{name : string|RegExp},visible:boolean)=>void

    mouseEvent : Observable<{eventName:string,event:MouseEvent}>
    mouseOverNehuba : Observable<{labelIndex : number, foundRegion : any | null}>
  }

  uiHandle : {
    
  }

  pluginControl : {
    loadExternalLibraries : (libraries:string[])=>Promise<void>
    unloadExternalLibraries : (libraries:string[])=>void
    [key:string] : any
  }
}

export interface NGLayerObj{

}