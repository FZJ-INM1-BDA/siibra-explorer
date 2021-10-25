/* eslint-disable @typescript-eslint/no-empty-function */
import {Injectable, NgZone, Optional, Inject, OnDestroy, InjectionToken} from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { select, Store } from "@ngrx/store";
import { Observable, Subject, Subscription, from, race, of, } from "rxjs";
import { distinctUntilChanged, map, filter, startWith, switchMap, catchError, mapTo, take } from "rxjs/operators";
import { DialogService } from "src/services/dialogService.service";
import { uiStateMouseOverSegmentsSelector } from "src/services/state/uiState/selectors";
import {
  viewerStateFetchedTemplatesSelector,
} from "src/services/state/viewerState/selectors";
import {
  getLabelIndexMap,
  getMultiNgIdsRegionsLabelIndexMap,
  IavRootStoreInterface,
  safeFilter
} from "src/services/stateStore.service";
import { ClickInterceptor, CLICK_INTERCEPTOR_INJECTOR } from "src/util";
import { FRAGMENT_EMIT_RED } from "src/viewerModule/nehuba/nehubaViewer/nehubaViewer.component";
import { IPluginManifest, PluginServices } from "src/plugin";
import { ILoadMesh } from 'src/messaging/types'
import { CANCELLABLE_DIALOG } from "src/util/interfaces";

declare let window

interface IRejectUserInput{
  userInitiated: boolean
  reason?: string
}

interface IGetUserSelectRegionPr{
  message: string
  promise: Promise<any>
  spec?: ICustomRegionSpec
  rs: (region: any) => void
  rj: (reject: IRejectUserInput) => void
}

@Injectable({
  providedIn : 'root'
})

export class AtlasViewerAPIServices implements OnDestroy{

  public loadMesh$ = new Subject<ILoadMesh>()

  private onDestoryCb: (() => void)[] = []
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

  private dismissDialog: () => void
  public getUserToSelectRegion: IGetUserSelectRegionPr[] = []
  public getUserToSelectRegionUI$: Subject<IGetUserSelectRegionPr[]> = new Subject()

  public getNextUserRegionSelectHandler: () => IGetUserSelectRegionPr = () => {
    if (this.getUserToSelectRegion.length > 0) {
      return this.getUserToSelectRegion[this.getUserToSelectRegion.length - 1]
    }
    else return null
  }

  public popUserRegionSelectHandler = () => {
    if (this.getUserToSelectRegion.length > 0) {
      this.getUserToSelectRegion.pop()
      this.getUserToSelectRegionUI$.next([...this.getUserToSelectRegion])
    }
  }

  private s: Subscription[] = []

  private onMouseClick(ev: any): boolean {
    const { rs, spec } = this.getNextUserRegionSelectHandler() || {}
    if (!!rs) {

      let moSegments
      this.store.pipe(
        select(uiStateMouseOverSegmentsSelector),
        take(1)
      ).subscribe(val => moSegments = val)

      /**
       * getROI api
       */
      if (spec) {
        /**
         * if spec of overwrite click is for a point
         */
        if (spec.type === EnumCustomRegion.POINT) {
          this.popUserRegionSelectHandler()
          let mousePositionReal
          // rather than commiting mousePositionReal in state via action, do a single subscription instead.
          // otherwise, the state gets updated way too often
          if (window && (window as any).nehubaViewer) {
            (window as any).nehubaViewer.mousePosition.inRealSpace
              .take(1)
              .subscribe(floatArr => {
                mousePositionReal = floatArr && Array.from(floatArr).map((val: number) => val / 1e6)
              })
          }
          rs({
            type: spec.type,
            payload: mousePositionReal
          })
          return false
        }

        /**
         * if spec of overwrite click is for a point
         */
        if (spec.type === EnumCustomRegion.PARCELLATION_REGION) {

          if (!!moSegments && Array.isArray(moSegments) && moSegments.length > 0) {
            this.popUserRegionSelectHandler()
            rs({
              type: spec.type,
              payload: moSegments
            })
            return false
          }
        }
      } else {
        /**
         * selectARegion API
         * TODO deprecate
         */
        if (!!moSegments && Array.isArray(moSegments) && moSegments.length > 0) {
          this.popUserRegionSelectHandler()
          rs(moSegments[0])
          return false
        }
      }
    }
    return true
  }

  constructor(
    private store: Store<IavRootStoreInterface>,
    private dialogService: DialogService,
    private snackbar: MatSnackBar,
    private zone: NgZone,
    private pluginService: PluginServices,
    @Optional() @Inject(CANCELLABLE_DIALOG) openCancellableDialog: (message: string, options: any) => () => void,
    @Optional() @Inject(CLICK_INTERCEPTOR_INJECTOR) clickInterceptor: ClickInterceptor
  ) {
    if (clickInterceptor) {
      const { register, deregister } = clickInterceptor
      const onMouseClick = this.onMouseClick.bind(this)
      register(onMouseClick)
      this.onDestoryCb.push(() => deregister(onMouseClick))
    }
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
      select(viewerStateFetchedTemplatesSelector)
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
          throw new Error(`uihandle.getModalHandler has been deprecated`)
        },

        /* to be overwritten by atlasViewer.component.ts */
        getToastHandler : () => {
          throw new Error('uiHandle.getToastHandler has been deprecated')
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
          console.warn(`interactiveViewer.uiHandle.getUserToSelectARegion is becoming deprecated. Use getUserToSelectRoi instead`)
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
        getUserToSelectRoi: (message: string, spec: ICustomRegionSpec) => {
          if (!spec || !spec.type) throw new Error(`spec.type must be defined for getUserToSelectRoi`)
          const obj = {
            message,
            spec,
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

    this.s.push(
      this.loadMesh$.subscribe(({ url, id, type, customFragmentColor = null }) => {
        if (!this.interactiveViewer.viewerHandle) {
          this.snackbar.open('No atlas loaded! Loading mesh failed!', 'Dismiss')
        }
        this.interactiveViewer.viewerHandle?.loadLayer({
          [id]: {
            type: 'mesh',
            source: `vtk://${url}`,
            shader: `void main(){${customFragmentColor || FRAGMENT_EMIT_RED};}`
          }
        })
      })
    )
  }

  ngOnDestroy(){
    while (this.onDestoryCb.length > 0) this.onDestoryCb.pop()()
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

  viewerHandle?: IVIewerHandle

  uiHandle: {
    getModalHandler: () => void
    getToastHandler: () => void
    launchNewWidget: (manifest: IPluginManifest) => Promise<any>
    getUserInput: (config: IGetUserInputConfig) => Promise<string>
    getUserConfirmation: (config: IGetUserConfirmation) => Promise<any>
    getUserToSelectARegion: (selectingMessage: any) => Promise<any>
    getUserToSelectRoi: (selectingMessage: string, spec?: ICustomRegionSpec) => Promise<any>
    cancelPromise: (pr: Promise<any>) => void
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
  color?: [number, number, number]
}

export enum EnumCustomRegion{
  POINT = 'POINT',
  PARCELLATION_REGION = 'PARCELLATION_REGION',
}

export interface ICustomRegionSpec{
  type: string // type of EnumCustomRegion
}

export interface IVIewerHandle {

  setNavigationLoc: (coordinates: [number, number, number], realSpace?: boolean) => void
  moveToNavigationLoc: (coordinates: [number, number, number], realSpace?: boolean) => void
  setNavigationOri: (quat: [number, number, number, number]) => void
  moveToNavigationOri: (quat: [number, number, number, number]) => void
  showSegment: (labelIndex: number) => void
  hideSegment: (labelIndex: number) => void
  showAllSegments: () => void
  hideAllSegments: () => void

  getLayersSegmentColourMap: () => Map<string, Map<number, {red: number, green: number, blue: number}>>

  applyLayersColourMap: (newLayerColourMap: Map<string, Map<number, {red: number, green: number, blue: number}>>) => void

  loadLayer: (layerobj: any) => any
  removeLayer: (condition: {name: string | RegExp}) => string[]
  setLayerVisibility: (condition: {name: string|RegExp}, visible: boolean) => void

  add3DLandmarks: (landmarks: IUserLandmark[]) => void
  remove3DLandmarks: (ids: string[]) => void

  mouseEvent: Observable<{eventName: string, event: MouseEvent}>
  mouseOverNehuba: Observable<{labelIndex: number, foundRegion: any | null}>
  mouseOverNehubaLayers: Observable<Array<{layer: {name: string}, segment: any | number }>>
  mouseOverNehubaUI: Observable<{ annotation: any, segments: any, landmark: any, customLandmark: any }>
  getNgHash: () => string
}

export type TSetViewerHandle = (viewerHandle: IVIewerHandle) => void

export const API_SERVICE_SET_VIEWER_HANDLE_TOKEN = new InjectionToken<TSetViewerHandle>('API_SERVICE_SET_VIEWER_HANDLE_TOKEN')

export const setViewerHandleFactory = (apiService: AtlasViewerAPIServices) => {
  return (viewerHandle: IVIewerHandle) => apiService.interactiveViewer.viewerHandle = viewerHandle
}
