import {Injectable, NgZone} from "@angular/core";
import { select, Store } from "@ngrx/store";
import { Observable } from "rxjs";
import { distinctUntilChanged, map, filter, startWith } from "rxjs/operators";
import { DialogService } from "src/services/dialogService.service";
import {
  DISABLE_PLUGIN_REGION_SELECTION,
  getLabelIndexMap,
  getMultiNgIdsRegionsLabelIndexMap,
  IavRootStoreInterface,
  safeFilter
} from "src/services/stateStore.service";
import { ModalHandler } from "../util/pluginHandlerClasses/modalHandler";
import { ToastHandler } from "../util/pluginHandlerClasses/toastHandler";
import { IPluginManifest, PluginServices } from "./pluginUnit";
import { ENABLE_PLUGIN_REGION_SELECTION } from "src/services/state/uiState.store";

declare let window

@Injectable({
  providedIn : 'root',
})

export class AtlasViewerAPIServices {

  private loadedTemplates$: Observable<any>
  private selectParcellation$: Observable<any>
  public interactiveViewer: IInteractiveViewerInterface

  public loadedLibraries: Map<string, {counter: number, src: HTMLElement|null}> = new Map()

  public getUserToSelectARegionResolve: any
  public rejectUserSelectionMode: any

  constructor(
    private store: Store<IavRootStoreInterface>,
    private dialogService: DialogService,
    private zone: NgZone,
    private pluginService: PluginServices,
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
          select('fetchedDataEntries'),
          startWith([])
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
        launchNewWidget: (manifest) => this.pluginService.launchNewWidget(manifest)
          .then(() => {
            // trigger change detection in Angular
            // otherwise, model won't be updated until user input

            /* eslint-disable-next-line @typescript-eslint/no-empty-function */
            this.zone.run(() => {  })
          }),

        getUserInput: config => this.dialogService.getUserInput(config) ,
        getUserConfirmation: config => this.dialogService.getUserConfirm(config),

        getUserToSelectARegion: (selectingMessage) => new Promise((resolve, reject) => {
          this.zone.run(() => {
            this.store.dispatch({
              type: ENABLE_PLUGIN_REGION_SELECTION,
              payload: selectingMessage
            })

            this.getUserToSelectARegionResolve = resolve
            this.rejectUserSelectionMode = reject
          })
        }),

        // ToDo Method should be able to cancel any pending promise.
        cancelPromise: (pr) => {
          this.zone.run(() => {
            if (pr === this.interactiveViewer.uiHandle.getUserToSelectARegion) {
              if (this.rejectUserSelectionMode) this.rejectUserSelectionMode()
              this.store.dispatch({type: DISABLE_PLUGIN_REGION_SELECTION})
            }

          })
        }

      },
      pluginControl: new Proxy({}, {
        get: (_, prop) => {
          if (prop === 'loadExternalLibraries') return this.pluginService.loadExternalLibraries
          if (prop === 'unloadExternalLibraries') return this.pluginService.unloadExternalLibraries
          if (typeof prop === 'string') return this.pluginService.pluginHandlersMap.get(prop)
          return undefined
        }
      }) as any,
    }
    window.interactiveViewer = this.interactiveViewer
    this.init()
  }

  private init() {
    this.loadedTemplates$.subscribe(templates => this.interactiveViewer.metadata.loadedTemplates = templates)
    this.selectParcellation$.pipe(
      filter(p => !!p && p.regions),
      distinctUntilChanged()
    ).subscribe(parcellation => {
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
    getUserToSelectARegion: (selectingMessage: any) => Promise<any>
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
