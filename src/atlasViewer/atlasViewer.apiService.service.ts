import { Injectable } from "@angular/core";
import { select, Store } from "@ngrx/store";
import {Observable, Subject} from "rxjs";
import { distinctUntilChanged, map } from "rxjs/operators";
import { DialogService } from "src/services/dialogService.service";
import { LoggingService } from "src/services/logging.service";
import {
  DISABLE_PLUGIN_REGION_SELECTION,
  getLabelIndexMap,
  getMultiNgIdsRegionsLabelIndexMap,
  IavRootStoreInterface,
  safeFilter
} from "src/services/stateStore.service";
import { ModalHandler } from "../util/pluginHandlerClasses/modalHandler";
import { ToastHandler } from "../util/pluginHandlerClasses/toastHandler";
import { IPluginManifest } from "./atlasViewer.pluginService.service";
import {resolve} from "dns";
import {ENABLE_PLUGIN_REGION_SELECTION} from "src/services/state/uiState.store";

declare let window

@Injectable({
  providedIn : 'root',
})

export class AtlasViewerAPIServices {

  private loadedTemplates$: Observable<any>
  private selectParcellation$: Observable<any>
  public interactiveViewer: IInteractiveViewerInterface

  public loadedLibraries: Map<string, {counter: number, src: HTMLElement|null}> = new Map()

  public getUserToSelectARegionResolve
  public getUserToSelectARegionReject

  public getUserToSelectARegionSubject = new Subject<any>()

  constructor(
    private store: Store<IavRootStoreInterface>,
    private dialogService: DialogService,
    private log: LoggingService,
  ) {

    this.loadedTemplates$ = this.store.pipe(
      select('viewerState'),
      safeFilter('fetchedTemplates'),
      map(state => state.fetchedTemplates),
    )

    this.selectParcellation$ = this.store.pipe(
      select('viewerState'),
      safeFilter('parcellationSelected'),
      map(state => state.parcellationSelected),
    )

    this.interactiveViewer = {
      metadata : {
        selectedTemplateBSubject : this.store.pipe(
          select('viewerState'),
          safeFilter('templateSelected'),
          map(state => state.templateSelected)),

        selectedParcellationBSubject : this.store.pipe(
          select('viewerState'),
          safeFilter('parcellationSelected'),
          map(state => state.parcellationSelected)),

        selectedRegionsBSubject : this.store.pipe(
          select('viewerState'),
          safeFilter('regionsSelected'),
          map(state => state.regionsSelected),
          distinctUntilChanged((arr1, arr2) =>
            arr1.length === arr2.length &&
            (arr1 as any[]).every((item, index) => item.name === arr2[index].name)),
        ),

        loadedTemplates : [],

        // TODO deprecate
        regionsLabelIndexMap : new Map(),

        layersRegionLabelIndexMap: new Map(),

        datasetsBSubject : this.store.pipe(
          select('dataStore'),
          safeFilter('fetchedDataEntries'),
          map(state => state.fetchedDataEntries),
        ),
      },
      uiHandle : {
        getModalHandler : () => {
          const handler = new ModalHandler()
          let modalRef
          handler.show = () => {
            /**
             * TODO enable
             * temporarily disabled
             */
            // modalRef = this.modalService.show(ModalUnit, {
            //   initialState : {
            //     title : handler.title,
            //     body : handler.body
            //       ? handler.body
            //       : 'handler.body has yet been defined ...',
            //     footer : handler.footer
            //   },
            //   class : this.darktheme ? 'darktheme' : 'not-darktheme',
            //   backdrop : handler.dismissable ? true : 'static',
            //   keyboard : handler.dismissable
            // })
          }
          handler.hide = () => {
            if (modalRef) {
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
        launchNewWidget: (_manifest) => {
          return Promise.reject('Needs to be overwritted')
        },

        getUserInput: config => this.dialogService.getUserInput(config) ,
        getUserConfirmation: config => this.dialogService.getUserConfirm(config),

        getUserToSelectARegion: (selectingMessage) => {
          this.store.dispatch({
            type: ENABLE_PLUGIN_REGION_SELECTION,
            payload: selectingMessage
          })
          return this.getUserToSelectARegionSubject.asObservable()
        },

        cancelPromise: (pr) => {
          if (pr === this.interactiveViewer.uiHandle.getUserToSelectARegion) {
            this.store.dispatch({type: DISABLE_PLUGIN_REGION_SELECTION})
          }
        }

      },
      pluginControl : {
        loadExternalLibraries : () => Promise.reject('load External Library method not over written')
        ,
        unloadExternalLibraries : () => {
          this.log.warn('unloadExternalLibrary method not overwritten by atlasviewer')
        },
      },
    }
    window.interactiveViewer = this.interactiveViewer
    this.init()

    /**
     * TODO debugger debug
     */
    window.uiHandle = this.interactiveViewer.uiHandle
  }

  private init() {
    this.loadedTemplates$.subscribe(templates => this.interactiveViewer.metadata.loadedTemplates = templates)
    this.selectParcellation$.subscribe(parcellation => {
      this.interactiveViewer.metadata.regionsLabelIndexMap = getLabelIndexMap(parcellation.regions)
      this.interactiveViewer.metadata.layersRegionLabelIndexMap = getMultiNgIdsRegionsLabelIndexMap(parcellation)
    })
  }
}

export interface IInteractiveViewerInterface {

  metadata: {
    selectedTemplateBSubject: Observable<any|null>
    selectedParcellationBSubject: Observable<any|null>
    selectedRegionsBSubject: Observable<any[]|null>
    loadedTemplates: any[]
    regionsLabelIndexMap: Map<number, any> | null
    layersRegionLabelIndexMap: Map<string, Map<number, any>>
    datasetsBSubject: Observable<any[]>
  }

  viewerHandle?: {
    setNavigationLoc: (coordinates: [number, number, number], realSpace?: boolean) => void
    moveToNavigationLoc: (coordinates: [number, number, number], realSpace?: boolean) => void
    setNavigationOri: (quat: [number, number, number, number]) => void
    moveToNavigationOri: (quat: [number, number, number, number]) => void
    showSegment: (labelIndex: number) => void
    hideSegment: (labelIndex: number) => void
    showAllSegments: () => void
    hideAllSegments: () => void

    // TODO deprecate
    segmentColourMap: Map<number, {red: number, green: number, blue: number}>

    getLayersSegmentColourMap: () => Map<string, Map<number, {red: number, green: number, blue: number}>>

    // TODO deprecate
    applyColourMap: (newColourMap: Map<number, {red: number, green: number, blue: number}>) => void

    applyLayersColourMap: (newLayerColourMap: Map<string, Map<number, {red: number, green: number, blue: number}>>) => void

    loadLayer: (layerobj: any) => any
    removeLayer: (condition: {name: string | RegExp}) => string[]
    setLayerVisibility: (condition: {name: string|RegExp}, visible: boolean) => void

    add3DLandmarks: (landmarks: IUserLandmark[]) => void
    remove3DLandmarks: (ids: string[]) => void

    mouseEvent: Observable<{eventName: string, event: MouseEvent}>
    mouseOverNehuba: Observable<{labelIndex: number, foundRegion: any | null}>
    /**
     * TODO add to documentation
     */
    mouseOverNehubaLayers: Observable<Array<{layer: {name: string}, segment: any | number }>>

    getNgHash: () => string
  }

  uiHandle: {
    getModalHandler: () => ModalHandler
    getToastHandler: () => ToastHandler
    launchNewWidget: (manifest: IPluginManifest) => Promise<any>
    getUserInput: (config: IGetUserInputConfig) => Promise<string>
    getUserConfirmation: (config: IGetUserConfirmation) => Promise<any>
    getUserToSelectARegion: (selectingMessage: String) => Observable<any>
    cancelPromise: (pr) => void
  }

  pluginControl: {
    loadExternalLibraries: (libraries: string[]) => Promise<void>
    unloadExternalLibraries: (libraries: string[]) => void
    [key: string]: any
  }
}

interface IGetUserConfirmation {
  title?: string
  message?: string
}

interface IGetUserInputConfig extends IGetUserConfirmation {
  placeholder?: string
  defaultValue?: string
}

export interface IUserLandmark {
  name: string
  position: [number, number, number]
  id: string /* probably use the it to track and remove user landmarks */
  highlight: boolean
}
