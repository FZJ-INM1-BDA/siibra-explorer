/* eslint-disable @typescript-eslint/no-empty-function */
import {Injectable, NgZone, Optional, Inject, OnDestroy} from "@angular/core";
import { select, Store } from "@ngrx/store";
import { Observable, Subject, Subscription, from, race, of, } from "rxjs";
import { distinctUntilChanged, map, filter, startWith, switchMap, catchError, mapTo } from "rxjs/operators";
import { DialogService } from "src/services/dialogService.service";
import {
  getLabelIndexMap,
  getMultiNgIdsRegionsLabelIndexMap,
  IavRootStoreInterface,
  safeFilter
} from "src/services/stateStore.service";
import { ModalHandler } from "../util/pluginHandlerClasses/modalHandler";
import { ToastHandler } from "../util/pluginHandlerClasses/toastHandler";
import { IPluginManifest, PluginServices } from "./pluginUnit";

declare let window

interface IRejectUserInput{
  userInitiated: boolean
  reason?: string
}

interface IGetUserSelectRegionPr{
  message: string
  promise: Promise<any>
  rs: (region: any) => void
  rj: (reject: IRejectUserInput) => void
}

export const CANCELLABLE_DIALOG = 'CANCELLABLE_DIALOG'
export const GET_TOAST_HANDLER_TOKEN = 'GET_TOAST_HANDLER_TOKEN'

@Injectable({
  providedIn : 'root',
})

export class AtlasViewerAPIServices implements OnDestroy{

  private loadedTemplates$: Observable<any>
  private selectParcellation$: Observable<any>
  public interactiveViewer: IInteractiveViewerInterface

  public loadedLibraries: Map<string, {counter: number, src: HTMLElement|null}> = new Map()

  public removeBasedOnPr = (pr: Promise<any>, {userInitiated = false} = {}) => {

    const idx = this.getUserToSelectRegion.findIndex(({ promise }) => promise === pr)
    if (idx >=0) {
      const { rj } = this.getUserToSelectRegion.splice(idx, 1)[0]
      this.getUserToSelectRegionUI$.next([...this.getUserToSelectRegion])
      this.zone.run(() => {  })
      rj({ userInitiated })
    }
    else throw new Error(`This promise has already been fulfilled.`)

  }

  private dismissDialog: Function
  public getUserToSelectRegion: IGetUserSelectRegionPr[] = []
  public getUserToSelectRegionUI$: Subject<IGetUserSelectRegionPr[]> = new Subject()

  public getUserRegionSelectHandler: () => IGetUserSelectRegionPr = () => {
    if (this.getUserToSelectRegion.length > 0) {
      const handler =  this.getUserToSelectRegion.pop()
      this.getUserToSelectRegionUI$.next([...this.getUserToSelectRegion])
      return handler
    } 
    else return null
  }

  private s: Subscription[] = []

  constructor(
    private store: Store<IavRootStoreInterface>,
    private dialogService: DialogService,
    private zone: NgZone,
    private pluginService: PluginServices,
    @Optional() @Inject(CANCELLABLE_DIALOG) openCancellableDialog: (message: string, options: any) => () => void,
    @Optional() @Inject(GET_TOAST_HANDLER_TOKEN) private getToastHandler: Function,
  ) {
    if (openCancellableDialog) {
      this.s.push(
        this.getUserToSelectRegionUI$.pipe(
          distinctUntilChanged(),
          switchMap(arr => {
            if (this.dismissDialog) {
              this.dismissDialog()
              this.dismissDialog = null
            }
            
            if (arr.length === 0) return of(null)

            const last = arr[arr.length - 1]
            const { message, promise } = last
            return race(
              from(new Promise(resolve => {
                this.dismissDialog = openCancellableDialog(message, {
                  userCancelCallback: () => {
                    resolve(last)
                  },
                  ariaLabel: message
                })
              })),
              from(promise).pipe(
                catchError(() => of(null)),
                mapTo(null),
              )
            )
          })
        ).subscribe(obj => {
          if (obj) {
            const { promise, rj } = obj
            rj({ userInitiated: true })
            this.removeBasedOnPr(promise, { userInitiated: true })
          }
        })
      )
    }

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
          if (this.getToastHandler) return this.getToastHandler()
          else throw new Error('getToast Handler not overwritten by atlasViewer.component.ts')
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

        getUserToSelectARegion: message => {
          const obj = {
            message,
            promise: null,
            rs: null,
            rj: null
          }
          const pr = new Promise((rs, rj) => {
            obj.rs = rs
            obj.rj = rj
          })

          obj.promise = pr

          this.getUserToSelectRegion.push(obj)
          this.getUserToSelectRegionUI$.next([...this.getUserToSelectRegion])
          this.zone.run(() => {

          })
          return pr
        },

        cancelPromise: pr => {
          this.removeBasedOnPr(pr)

          this.zone.run(() => {  })
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

  ngOnDestroy(){
    while(this.s.length > 0){
      this.s.pop().unsubscribe()
    }
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

export const overrideNehubaClickFactory = (apiService: AtlasViewerAPIServices, getMouseoverSegments: () => any [] ) => {
  return (next: () => void) => {
    const moSegments = getMouseoverSegments()
    if (!!moSegments && Array.isArray(moSegments) && moSegments.length > 0) {
      const { rs } = apiService.getUserRegionSelectHandler() || {}
      if (!!rs) {
        return rs(moSegments[0])
      }
    }
    next()
  }
}
