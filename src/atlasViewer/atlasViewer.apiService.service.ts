import { Injectable } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { ViewerStateInterface, safeFilter, getLabelIndexMap, isDefined } from "src/services/stateStore.service";
import { Observable } from "rxjs";
import { map, distinctUntilChanged, filter } from "rxjs/operators";
import { BsModalService } from "ngx-bootstrap/modal";
import { ModalUnit } from "./modalUnit/modalUnit.component";
import { ModalHandler } from "../util/pluginHandlerClasses/modalHandler";
import { ToastHandler } from "../util/pluginHandlerClasses/toastHandler";
import { PluginManifest } from "./atlasViewer.pluginService.service";

declare var window

@Injectable({
  providedIn : 'root'
})

export class AtlasViewerAPIServices{

  private loadedTemplates$ : Observable<any>
  private selectParcellation$ : Observable<any>
  private selectTemplate$ : Observable<any>
  private darktheme : boolean
  public interactiveViewer : InteractiveViewerInterface

  public loadedLibraries : Map<string,{counter:number,src:HTMLElement|null}> = new Map()

  constructor(
    private store : Store<ViewerStateInterface>,
    private modalService: BsModalService
  ){

    this.loadedTemplates$ = this.store.pipe(
      select('viewerState'),
      safeFilter('fetchedTemplates'),
      map(state=>state.fetchedTemplates)
    )

    this.selectTemplate$ = this.store.pipe(
      select('viewerState'),
      filter(state => isDefined(state) && isDefined(state.templateSelected)),
      map(state => state.templateSelected),
      distinctUntilChanged((t1, t2) => t1.name === t2.name)
    )

    this.selectParcellation$ = this.store.pipe(
      select('viewerState'),
      safeFilter('parcellationSelected'),
      map(state => state.parcellationSelected)
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
          map(state=>state.regionsSelected),
          distinctUntilChanged((arr1, arr2) => arr1.length === arr2.length && (arr1 as any[]).every((item, index) => item.name === arr2[index].name))
        ),

        loadedTemplates : [],

        regionsLabelIndexMap : new Map(),

        datasetsBSubject : this.store.pipe(
          select('dataStore'),
          safeFilter('fetchedDataEntries'),
          map(state=>state.fetchedDataEntries)
        )
      },
      uiHandle : {
        getModalHandler : () => {
          const handler = new ModalHandler()
          let modalRef
          handler.show = () => {
            modalRef = this.modalService.show(ModalUnit, {
              initialState : {
                title : handler.title,
                body : handler.body
                  ? handler.body
                  : 'handler.body has yet been defined ...',
                footer : handler.footer
              },
              class : this.darktheme ? 'darktheme' : 'not-darktheme',
              backdrop : handler.dismissable ? true : 'static',
              keyboard : handler.dismissable
            })
          }
          handler.hide = () => {
            if(modalRef){
              modalRef.hide()
              modalRef = null
            }
          }
          return handler
        },
        
        /* to be overwritten by atlasViewer.component.ts */
        getToastHandler : () => {
          throw new Error('getToast Handler not overwritten by atlasViewer.component.ts')
        },

        /**
         * to be overwritten by atlas
         */
        launchNewWidget: (manifest) => {
          return Promise.reject('Needs to be overwritted')
        }
      },
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

    /**
     * TODO debugger debug
     */
    window.uiHandle = this.interactiveViewer.uiHandle
  }

  private init(){
    this.loadedTemplates$.subscribe(templates=>this.interactiveViewer.metadata.loadedTemplates = templates)
    this.selectParcellation$.subscribe(parcellation => this.interactiveViewer.metadata.regionsLabelIndexMap = getLabelIndexMap(parcellation.regions))
    this.selectTemplate$.subscribe(template => this.darktheme = template.useTheme === 'dark')
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

    add3DLandmarks : (landmarks: UserLandmark[]) => void
    remove3DLandmarks : (ids:string[]) => void

    mouseEvent : Observable<{eventName:string,event:MouseEvent}>
    mouseOverNehuba : Observable<{labelIndex : number, foundRegion : any | null}>
    /**
     * TODO add to documentation
     */
    mouseOverNehubaLayers: Observable<{layer:{name:string}, segment: any | number }[]>

    getNgHash : () => string
  }

  uiHandle : {
    getModalHandler: () => ModalHandler
    getToastHandler: () => ToastHandler
    launchNewWidget: (manifest:PluginManifest) => Promise<any>
  }

  pluginControl : {
    loadExternalLibraries : (libraries:string[])=>Promise<void>
    unloadExternalLibraries : (libraries:string[])=>void
    [key:string] : any
  }
}

export interface UserLandmark{
  name : string
  position : [number, number, number]
  id : string /* probably use the it to track and remove user landmarks */
  highlight : boolean
}

export interface NGLayerObj{

}