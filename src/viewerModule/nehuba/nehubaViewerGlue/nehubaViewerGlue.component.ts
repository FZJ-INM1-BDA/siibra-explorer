import { AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnDestroy, Optional, Output, TemplateRef, ViewChild } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { asyncScheduler, BehaviorSubject, combineLatest, fromEvent, merge, Observable, of, Subject, Subscription } from "rxjs";
import { ClickInterceptor, CLICK_INTERCEPTOR_INJECTOR } from "src/util";
import { debounceTime, distinctUntilChanged, filter, map, mapTo, scan, shareReplay, startWith, switchMap, switchMapTo, take, tap, throttleTime } from "rxjs/operators";
import { ARIA_LABELS, IDS, QUICKTOUR_DESC } from 'common/constants'
import { LoggingService } from "src/logging";
import { EnumViewerEvt, IViewer, TViewerEvent } from "../../viewer.interface";
import { NehubaViewerUnit } from "../nehubaViewer/nehubaViewer.component";
import { NehubaViewerContainerDirective, TMouseoverEvent } from "../nehubaViewerInterface/nehubaViewerInterface.directive";
import { cvtNavigationObjToNehubaConfig, getFourPanel, getHorizontalOneThree, getSinglePanel, getVerticalOneThree, scanSliceViewRenderFn, takeOnePipe } from "../util";
import { API_SERVICE_SET_VIEWER_HANDLE_TOKEN, TSetViewerHandle } from "src/atlasViewer/atlasViewer.apiService.service";
import { MouseHoverDirective } from "src/mouseoverModule";
import { NehubaMeshService } from "../mesh.service";
import { IQuickTourData } from "src/ui/quickTour/constrants";
import { NehubaLayerControlService, IColorMap, SET_COLORMAP_OBS, SET_LAYER_VISIBILITY } from "../layerCtrl.service";
import { getExportNehuba, getUuid, switchMapWaitFor } from "src/util/fn";
import { INavObj } from "../navigation.service";
import { NG_LAYER_CONTROL, SET_SEGMENT_VISIBILITY } from "../layerCtrl.service/layerCtrl.util";
import { MatSnackBar } from "@angular/material/snack-bar";
import { getShader } from "src/util/constants";
import { EnumColorMapName } from "src/util/colorMaps";
import { MatDialog } from "@angular/material/dialog";
import { AtlasWorkerService } from "src/atlasViewer/atlasViewer.workerService.service";
import { SAPI, SapiAtlasModel, SapiParcellationModel, SapiRegionModel, SapiSpaceModel } from "src/atlasComponents/sapi";
import { NehubaConfig, getNehubaConfig, fromRootStore, NgLayerSpec, NgPrecompMeshSpec, NgSegLayerSpec, getParcNgId, getRegionLabelIndex } from "../config.service";
import { SET_MESHES_TO_LOAD } from "../constants";
import { annotation, atlasAppearance, atlasSelection, userInteraction, userInterface, generalActions } from "src/state";

export const INVALID_FILE_INPUT = `Exactly one (1) nifti file is required!`

@Component({
  selector: 'iav-cmp-viewer-nehuba-glue',
  templateUrl: './nehubaViewerGlue.template.html',
  styleUrls: [
    './nehubaViewerGlue.style.css'
  ],
  exportAs: 'iavCmpViewerNehubaGlue',
  providers: [
    {
      provide: SET_MESHES_TO_LOAD,
      useFactory: (meshService: NehubaMeshService) => meshService.loadMeshes$,
      deps: [ NehubaMeshService ]
    },
    NehubaMeshService,
    {
      provide: SET_COLORMAP_OBS,
      useFactory: (layerCtrl: NehubaLayerControlService) => layerCtrl.setColorMap$,
      deps: [ NehubaLayerControlService ]
    },
    {
      provide: SET_LAYER_VISIBILITY,
      useFactory: (layerCtrl: NehubaLayerControlService) => layerCtrl.visibleLayer$,
      deps: [ NehubaLayerControlService ]
    },
    {
      provide: SET_SEGMENT_VISIBILITY,
      useFactory: (layerCtrl: NehubaLayerControlService) => layerCtrl.segmentVis$,
      deps: [ NehubaLayerControlService ]
    },
    {
      provide: NG_LAYER_CONTROL,
      useFactory: (layerCtrl: NehubaLayerControlService) => layerCtrl.ngLayersController$,
      deps: [ NehubaLayerControlService ]
    },
    NehubaLayerControlService
  ]
})

export class NehubaGlueCmp implements IViewer<'nehuba'>, OnDestroy, AfterViewInit {

  @ViewChild('layerCtrlTmpl', { read: TemplateRef }) layerCtrlTmpl: TemplateRef<any>

  public ARIA_LABELS = ARIA_LABELS
  public IDS = IDS

  private currentPanelMode: userInterface.PanelMode

  @ViewChild(NehubaViewerContainerDirective, { static: true })
  public nehubaContainerDirective: NehubaViewerContainerDirective

  @ViewChild(MouseHoverDirective, { static: true })
  private mouseoverDirective: MouseHoverDirective

  public viewerLoaded: boolean = false

  private onhoverSegments: SapiRegionModel[] = []
  private onDestroyCb: (() => void)[] = []
  private viewerUnit: NehubaViewerUnit
  private multiNgIdsRegionsLabelIndexMap = new Map<string, Map<number, SapiRegionModel>>()

  private selectedParcellation$ = new BehaviorSubject<SapiParcellationModel>(null)
  private _selectedParcellation: SapiParcellationModel
  get selectedParcellation(){
    return this._selectedParcellation
  }
  @Input()
  set selectedParcellation(val: SapiParcellationModel) {
    this._selectedParcellation = val
    this.selectedParcellation$.next(val)
  }


  private selectedTemplate$ = new BehaviorSubject<SapiSpaceModel>(null)
  private _selectedTemplate: SapiSpaceModel
  get selectedTemplate(){
    return this._selectedTemplate
  }
  @Input()
  set selectedTemplate(val: SapiSpaceModel) {
    this._selectedTemplate = val
    this.selectedTemplate$.next(val)
  }


  private selectedAtlas$ = new BehaviorSubject<SapiAtlasModel>(null)
  private _selectedAtlas: SapiAtlasModel
  get selectedAtlas(){
    return this._selectedAtlas
  }
  @Input()
  set selectedAtlas(val: SapiAtlasModel) {
    this._selectedAtlas = val
    this.selectedAtlas$.next(val)
  }
  

  public nehubaConfig: NehubaConfig
  private navigation: any
  private newViewer$ = new Subject()

  public showPerpsectiveScreen$: Observable<string>
  public sliceViewLoadingMain$: Observable<[boolean, boolean, boolean]>
  private sliceRenderEvent$: Observable<CustomEvent>
  public perspectiveViewLoading$: Observable<string|null>
  public hoveredPanelIndices$: Observable<number>
  private viewPanelWeakMap = new WeakMap<HTMLElement, number>()
  public viewPanels: [HTMLElement, HTMLElement, HTMLElement, HTMLElement] = [null, null, null, null]
  private findPanelIndex = (panel: HTMLElement) => this.viewPanelWeakMap.get(panel)
  public nanometersToOffsetPixelsFn: Array<(...arg) => any> = []

  public quickTourSliceViewSlide: IQuickTourData = {
    order: 1,
    description: QUICKTOUR_DESC.SLICE_VIEW,
  }

  public quickTour3dViewSlide: IQuickTourData = {
    order: 2,
    description: QUICKTOUR_DESC.PERSPECTIVE_VIEW,
  }

  public quickTourIconsSlide: IQuickTourData = {
    order: 3,
    description: QUICKTOUR_DESC.VIEW_ICONS,
  }

  public customLandmarks$ = this.store$.pipe(
    select(annotation.selectors.annotations),
  )

  public filterCustomLandmark(lm: any){
    return !!lm['showInSliceView']
  }

  public panelOrder$ = this.store$.pipe(
    select(userInterface.selectors.panelOrder),
    distinctUntilChanged(),
    shareReplay(1),
  )

  private nehubaContainerSub: Subscription
  private setupNehubaEvRelay() {
    if (this.nehubaContainerSub) this.nehubaContainerSub.unsubscribe()
    if (!this.nehubaContainerDirective) return
    const {
      mouseOverSegments,
      navigationEmitter,
      mousePosEmitter,
    } = this.nehubaContainerDirective
    this.nehubaContainerSub = combineLatest([
      mouseOverSegments.pipe(
        startWith(null as TMouseoverEvent[])
      ),
      navigationEmitter.pipe(
        startWith(null as INavObj)
      ),
      mousePosEmitter.pipe(
        startWith(null as {
          voxel: number[]
          real: number[]
        })
      ),
    ]).pipe(
      throttleTime(16, asyncScheduler, { trailing: true })
    ).subscribe(([ seg, nav, mouse ]: [ TMouseoverEvent [], INavObj, { real: number[], voxel: number[] } ]) => {
      this.viewerEvent.emit({
        type: EnumViewerEvt.VIEWER_CTX,
        data: {
          viewerType: 'nehuba',
          payload: {
            nav,
            mouse,
            nehuba: seg && seg.map(v => {
              return {
                layerName: v.layer.name,
                labelIndices: [ Number(v.segmentId) ],
                regions: (() => {
                  const map = this.multiNgIdsRegionsLabelIndexMap.get(v.layer.name)
                  if (!map) return []
                  return [map.get(Number(v.segmentId))]
                })()
              }
            })
          }
        }
      })
    })
    this.onDestroyCb.push(
      () => {
        if (this.nehubaContainerSub) {
          this.nehubaContainerSub.unsubscribe()
          this.nehubaContainerSub = null
        }
      }
    )
  }

  ngAfterViewInit(){
    this.setQuickTourPos()
    this.setupNehubaEvRelay()
  }

  ngOnDestroy() {
    while (this.onDestroyCb.length) this.onDestroyCb.pop()()
  }

  private async loadParc(atlas: SapiAtlasModel, parcellation: SapiParcellationModel, space: SapiSpaceModel, ngLayers: Record<string, NgLayerSpec | NgPrecompMeshSpec | NgSegLayerSpec>) {
    /**
     * parcellation may be undefined
     */
    if ( !parcellation) {
      return
    }
    const pevs = await this.sapiSvc.getParcRegions(atlas["@id"], parcellation["@id"], space["@id"])

    const ngIdSegmentsMap: Record<string, number[]> = {}
    for (const key in ngLayers) {
      if ((ngLayers[key] as NgSegLayerSpec).labelIndicies) {
        ngIdSegmentsMap[key] = (ngLayers[key] as NgSegLayerSpec).labelIndicies
      }
    }
    this.viewerUnit.ngIdSegmentsMap = ngIdSegmentsMap
  }

  private unloadTmpl() {
    /**
     * clear existing container
     */
    this.viewerUnit = null
    this.nehubaContainerDirective.clear()

    /* on selecting of new template, remove additional nglayers */
    if (this.nehubaConfig) {
      
      const initialSpec = this.nehubaConfig.dataset.initialNgState
      const { layers } = initialSpec

      for (const layerName in layers) {
        this.store$.dispatch(
          atlasAppearance.actions.removeCustomLayer({
            id: layerName
          })
        )
      }
    }
  }

  private async loadTmpl(atlas: SapiAtlasModel, _template: SapiSpaceModel, parcellation: SapiParcellationModel, ngLayers: Record<string, NgLayerSpec | NgPrecompMeshSpec | NgSegLayerSpec>) {
    if (!_template) return
    /**
     * recalcuate zoom
     */
    const validSpaceIds = parcellation.brainAtlasVersions.map(bas => bas.coordinateSpace["@id"] as string)
    let template: SapiSpaceModel
    if (validSpaceIds.indexOf(_template["@id"]) >= 0) {
      template = _template
    } else {
      /**
       * selected parc does not have space as a valid output
       */
      this.store$.dispatch(
        generalActions.generalActionError({
          message: `space ${_template.fullName} is not defined in parcellation ${parcellation.brainAtlasVersions[0].fullName}`
        })
      )
      template = await this.sapiSvc.getSpaceDetail(this.selectedAtlas["@id"], parcellation.brainAtlasVersions[0].coordinateSpace["@id"] as string)
    }
    const config = getNehubaConfig(template)
    config.dataset.initialNgState.layers = ngLayers
    const overwritingInitState = this.navigation
      ? cvtNavigationObjToNehubaConfig(this.navigation, config.dataset.initialNgState)
      : {}

      config.dataset.initialNgState = {
      ...config.dataset.initialNgState,
      ...overwritingInitState,
    }

    this.nehubaConfig = config

    await this.nehubaContainerDirective.createNehubaInstance(config)
    this.viewerUnit = this.nehubaContainerDirective.nehubaViewerInstance
    this.sliceRenderEvent$.pipe(
      takeOnePipe()
    ).subscribe(ev => {

      for (const idx of [0, 1, 2]) {
        const e = ev[idx] as CustomEvent
        const el = e.target as HTMLElement
        this.viewPanelWeakMap.set(el, idx)
        this.viewPanels[idx] = el
        this.nanometersToOffsetPixelsFn[idx] = e.detail.nanometersToOffsetPixels
      }
    })

    await this.loadParc(atlas, parcellation, template, ngLayers)

    const initialSpec = config.dataset.initialNgState
    const { layers } = initialSpec

    for (const layerName in layers) {
      const l = layers[layerName]
      const customLayer: atlasAppearance.NgLayerCustomLayer = {
        id: layerName,
        source: l.source,
        visible: l.visible,
        transform: l.transform,
        clType: 'baselayer/nglayer'
      }

      this.store$.dispatch(
        atlasAppearance.actions.addCustomLayer({
          customLayer
        })
      )
    }

    this.newViewer$.next(true)
  }

  @Output()
  public viewerEvent = new EventEmitter<TViewerEvent<'nehuba'>>()

  constructor(
    private store$: Store<any>,
    private el: ElementRef,
    private log: LoggingService,
    private snackbar: MatSnackBar,
    private dialog: MatDialog,
    private worker: AtlasWorkerService,
    @Optional() @Inject(CLICK_INTERCEPTOR_INJECTOR) clickInterceptor: ClickInterceptor,
    @Optional() @Inject(API_SERVICE_SET_VIEWER_HANDLE_TOKEN) setViewerHandle: TSetViewerHandle,
    @Optional() private layerCtrlService: NehubaLayerControlService,
    private sapiSvc: SAPI,
  ){

    /**
     * define onclick behaviour
     */
    if (clickInterceptor) {
      const { deregister, register } = clickInterceptor
      const selOnhoverRegion = this.selectHoveredRegion.bind(this)
      register(selOnhoverRegion, { last: true })
      this.onDestroyCb.push(() => deregister(selOnhoverRegion))
    }

    /**
     * subscribe to ngIdtolblIdxToRegion
     */
    const ngIdSub = this.layerCtrlService.selectedATPR$.subscribe(({ atlas, parcellation, template, regions }) => {
      this.multiNgIdsRegionsLabelIndexMap.clear()
      for (const r of regions) {
        const ngId = getParcNgId(atlas, template, parcellation, r)
        const labelIndex = getRegionLabelIndex(atlas, template, parcellation, r)
        if (!this.multiNgIdsRegionsLabelIndexMap.has(ngId)) {
          this.multiNgIdsRegionsLabelIndexMap.set(ngId, new Map())
        }
        this.multiNgIdsRegionsLabelIndexMap.get(ngId).set(labelIndex, r)
      }
    })
    this.onDestroyCb.push(() => ngIdSub.unsubscribe())

    /**
     * on layout change
     */
    const redrawLayoutSub = combineLatest([
      this.store$.pipe(
        select(userInterface.selectors.panelMode),
        distinctUntilChanged(),
        shareReplay(1),
      ),
      this.panelOrder$,
    ]).pipe(
      switchMap(this.waitForNehuba.bind(this))
    ).subscribe(([mode, panelOrder]) => {
      
      this.currentPanelMode = mode as userInterface.PanelMode

      const viewPanels = panelOrder.split('').map(v => Number(v)).map(idx => this.viewPanels[idx]) as [HTMLElement, HTMLElement, HTMLElement, HTMLElement]

      /**
       * TODO smarter with event stream
       */
      if (!viewPanels.every(v => !!v)) {
        this.log.error(`on relayout, not every view panel is populated. This should not occur!`)
        return
      }

      switch (this.currentPanelMode) {
      case "H_ONE_THREE": {
        const element = this.removeExistingPanels()
        const newEl = getHorizontalOneThree(viewPanels)
        element.appendChild(newEl)
        break;
      }
      case "V_ONE_THREE": {
        const element = this.removeExistingPanels()
        const newEl = getVerticalOneThree(viewPanels)
        element.appendChild(newEl)
        break;
      }
      case "FOUR_PANEL": {
        const element = this.removeExistingPanels()
        const newEl = getFourPanel(viewPanels)
        element.appendChild(newEl)
        break;
      }
      case "SINGLE_PANEL": {
        const element = this.removeExistingPanels()
        const newEl = getSinglePanel(viewPanels)
        element.appendChild(newEl)
        break;
      }
      default:
      }
      for (const panel of viewPanels) {
        (panel as HTMLElement).classList.add('neuroglancer-panel')
      }

      // TODO needed to redraw?
      // see https://trello.com/c/oJOnlc6v/60-enlarge-panel-allow-user-rearrange-panel-position
      // further investigaation required
      this.nehubaContainerDirective.nehubaViewerInstance.redraw()
    })
    this.onDestroyCb.push(() => redrawLayoutSub.unsubscribe())

    /**
     * on hover segment
     */
    const onhovSegSub = this.store$.pipe(
      select(userInteraction.selectors.mousingOverRegions),
      distinctUntilChanged(),
    ).subscribe(arr => {
      this.onhoverSegments = arr
    })
    this.onDestroyCb.push(() => onhovSegSub.unsubscribe())

    const perspectiveRenderEvSub = this.newViewer$.pipe(
      switchMapTo(fromEvent<CustomEvent>(this.el.nativeElement, 'perpspectiveRenderEvent').pipe(
        take(1)
      ))
    ).subscribe(ev => {
      const perspPanel = ev.target as HTMLElement
      this.viewPanels[3] = perspPanel
      this.viewPanelWeakMap.set(perspPanel, 3)
    })
    this.onDestroyCb.push(() => perspectiveRenderEvSub.unsubscribe())

    this.sliceRenderEvent$ = fromEvent<CustomEvent>(this.el.nativeElement, 'sliceRenderEvent')
    this.sliceViewLoadingMain$ = this.sliceRenderEvent$.pipe(
      scan(scanSliceViewRenderFn, [null, null, null]),
      startWith([true, true, true] as [boolean, boolean, boolean]),
      shareReplay(1),
    )

    this.perspectiveViewLoading$ = fromEvent(this.el.nativeElement, 'perpspectiveRenderEvent').pipe(
      filter((event: CustomEvent) => event?.detail?.lastLoadedMeshId ),
      map(event => {

        /**
         * TODO dig into event detail to see if the exact mesh loaded
         */
        const { meshesLoaded, meshFragmentsLoaded: _meshFragmentsLoaded, lastLoadedMeshId: _lastLoadedMeshId } = (event as any).detail
        return meshesLoaded >= this.nehubaContainerDirective.nehubaViewerInstance.numMeshesToBeLoaded
          ? null
          : 'Loading meshes ...'
      }),
      distinctUntilChanged()
    )

    this.showPerpsectiveScreen$ = this.newViewer$.pipe(
      switchMapTo(this.sliceRenderEvent$.pipe(
        scan((acc, curr) => {

          /**
           * if at any point, all chunks have been loaded, always return loaded state
           */
          if (acc.every(v => v === 0)) return [0, 0, 0]
          const { detail = {}, target } = curr || {}
          const { missingChunks = -1, missingImageChunks = -1 } = detail
          const idx = this.findPanelIndex(target as HTMLElement)
          const returnAcc = [...acc]
          if (idx >= 0) {
            returnAcc[idx] = missingChunks + missingImageChunks
          }
          return returnAcc
        }, [-1, -1, -1]),
        map(arr => {
          let sum = 0
          let uncertain = false
          for (const num of arr) {
            if (num < 0) {
              uncertain = true
            } else {
              sum += num
            }
          }
          return sum > 0
            ? `Loading ${sum}${uncertain ? '+' : ''} chunks ...`
            : null
        }),
        distinctUntilChanged(),
        startWith('Loading ...'),
        throttleTime(100, asyncScheduler, { leading: true, trailing: true }),
        shareReplay(1),
      ))
    )

    this.hoveredPanelIndices$ = fromEvent(this.el.nativeElement, 'mouseover').pipe(
      switchMap((ev: MouseEvent) => merge(
        of(this.findPanelIndex(ev.target as HTMLElement)),
        fromEvent(this.el.nativeElement, 'mouseout').pipe(
          mapTo(null),
        ),
      )),
      debounceTime(20),
      shareReplay(1),
    )

    const newTmplSub = this.store$.pipe(
      select(atlasSelection.selectors.selectedATP),
      distinctUntilChanged((o, n) => {
        return o?.template?.["@id"] === n?.template?.["@id"]
      }),
      switchMap(ATP => {
        return this.store$.pipe(
          fromRootStore.getNgLayers(this.store$, this.sapiSvc),
          map(ngLayers => ({ ATP, ngLayers }))
        )
      }
      )
    ).subscribe(({ ATP, ngLayers }) => {
      const { template, parcellation, atlas } = ATP
      const { tmplNgLayers, tmplAuxNgLayers, parcNgLayers } = ngLayers
      

      // clean up previous tmpl
      this.unloadTmpl()

      const layerObj = {
        ...tmplNgLayers,
        ...tmplAuxNgLayers,
        ...parcNgLayers,
      }
      this.loadTmpl(atlas, template, parcellation, layerObj)
    })

    this.onDestroyCb.push(() => newTmplSub.unsubscribe())

    const setupViewerApiSub = this.newViewer$.pipe(
      tap(() => {
        setViewerHandle && setViewerHandle(null)
      }),
      switchMap(this.waitForNehuba.bind(this))
    ).subscribe(() => {
      setViewerHandle && setViewerHandle({
        setNavigationLoc : (coord, realSpace?) => this.nehubaContainerDirective.nehubaViewerInstance.setNavigationState({
          position : coord,
          positionReal : typeof realSpace !== 'undefined' ? realSpace : true,
        }),
        moveToNavigationLoc : (coord, _realSpace?) => {
          this.store$.dispatch(
            atlasSelection.actions.navigateTo({
              navigation: {
                position: coord
              },
              animation: true
            })
          )
        },
        setNavigationOri : (quat) => this.nehubaContainerDirective.nehubaViewerInstance.setNavigationState({
          orientation : quat,
        }),
        /* TODO introduce animation */
        moveToNavigationOri : (quat) => this.nehubaContainerDirective.nehubaViewerInstance.setNavigationState({
          orientation : quat,
        }),
        showSegment : (_labelIndex) => {
          /**
           * TODO reenable with updated select_regions api
           */
          this.log.warn(`showSegment is temporarily disabled`)
        },
        add3DLandmarks : landmarks => {
          // TODO check uniqueness of ID
          if (!landmarks.every(l => !!l.id)) {
            throw new Error('every landmarks needs to be identified with the id field')
          }
          if (!landmarks.every(l => !!l.position)) {
            throw new Error('every landmarks needs to have position defined')
          }
          if (!landmarks.every(l => l.position.constructor === Array) || !landmarks.every(l => l.position.every(v => !isNaN(v))) || !landmarks.every(l => l.position.length == 3)) {
            throw new Error('position needs to be a length 3 tuple of numbers ')
          }
          /**
           * add implementation to user landmarks
           */
          console.warn(`adding landmark not yet implemented`)
        },
        remove3DLandmarks : landmarkIds => {
          this.store$.dispatch(
            annotation.actions.rmAnnotations({
              annotations: landmarkIds.map(id => ({ "@id": id }))
            })
          )
        },
        hideSegment : (_labelIndex) => {
          /**
           * TODO reenable with updated select_regions api
           */
          this.log.warn(`hideSegment is temporarily disabled`)

        },
        showAllSegments : () => {
        },
        hideAllSegments : () => {
        },
        getLayersSegmentColourMap: () => {
          if (!this.layerCtrlService) {
            throw new Error(`layerCtrlService not injected. Cannot call getLayersSegmentColourMap`)
          }
          const newMainMap = new Map()
          for (const key in this.layerCtrlService.activeColorMap) {
            const obj = this.layerCtrlService.activeColorMap[key]
            const m = new Map()
            newMainMap.set(key, m)
            for (const labelIndex in obj) {
              m.set(Number(labelIndex), obj[labelIndex])
            }
          }
          return newMainMap
        },
        applyLayersColourMap: (map) => {
          if (!this.layerCtrlService) {
            throw new Error(`layerCtrlService not injected. Cannot call getLayersSegmentColourMap`)
          }
          const obj: IColorMap = {}
          for (const [ key, value ] of map.entries()) {
            const cmap = obj[key] = {}
            for (const [ labelIdx, rgb ] of value.entries()) {
              cmap[Number(labelIdx)] = rgb
            }
          }
          this.layerCtrlService.overwriteColorMap$.next(obj)
        },
        /**
         * TODO go via layerCtrl.service
         */
        loadLayer : (layerObj) => this.nehubaContainerDirective.nehubaViewerInstance.loadLayer(layerObj),
        removeLayer : (condition) => this.nehubaContainerDirective.nehubaViewerInstance.removeLayer(condition),
        setLayerVisibility : (condition, visible) => this.nehubaContainerDirective.nehubaViewerInstance.setLayerVisibility(condition, visible),
        mouseEvent : merge(
          fromEvent(this.el.nativeElement, 'click').pipe(
            map((ev: MouseEvent) => ({eventName : 'click', event: ev})),
          ),
          fromEvent(this.el.nativeElement, 'mousemove').pipe(
            map((ev: MouseEvent) => ({eventName : 'mousemove', event: ev})),
          ),
          /**
           * neuroglancer prevents propagation, so use capture instead
           */
          fromEvent(this.el.nativeElement, 'mousedown', { capture: true }).pipe(
            map((event: MouseEvent) => {
              return {
                eventName: 'mousedown',
                event
              }
            })
          ),
          fromEvent(this.el.nativeElement, 'mouseup').pipe(
            map((ev: MouseEvent) => ({eventName : 'mouseup', event: ev})),
          ),
        ) ,
        mouseOverNehuba : of(null).pipe(
          tap(() => console.warn('mouseOverNehuba observable is becoming deprecated. use mouseOverNehubaLayers instead.')),
        ),
        mouseOverNehubaUI: this.mouseoverDirective.currentOnHoverObs$.pipe(
          map(({annotation, landmark, userLandmark: customLandmark }) => ({annotation, landmark, customLandmark })),
          shareReplay(1),
        ),
        getNgHash : this.nehubaContainerDirective.nehubaViewerInstance.getNgHash,
      })
    })
    this.onDestroyCb.push(() => setupViewerApiSub.unsubscribe())

    // listen to navigation change from store
    const navSub = this.store$.pipe(
      select(atlasSelection.selectors.navigation)
    ).subscribe(nav => {
      this.navigation = nav
    })
    this.onDestroyCb.push(() => navSub.unsubscribe())
  }

  handleCycleViewEvent(){
    if (this.currentPanelMode !== "SINGLE_PANEL") return
    this.store$.dispatch(
      userInterface.actions.cyclePanelMode()
    )
  }

  handleViewerLoadedEvent(flag: boolean) {
    this.viewerEvent.emit({
      type: EnumViewerEvt.VIEWERLOADED,
      data: flag
    })
    this.viewerLoaded = flag
  }

  private selectHoveredRegion(_ev: any): boolean{
    /**
     * If label indicies are not defined by the ontology, it will be a string in the format of `{ngId}#{labelIndex}`
     */
    const trueOnhoverSegments = this.onhoverSegments && this.onhoverSegments.filter(v => typeof v === 'object')
    if (!trueOnhoverSegments || (trueOnhoverSegments.length === 0)) return true
    this.store$.dispatch(
      atlasSelection.actions.selectRegions({
        regions: trueOnhoverSegments.slice(0, 1)
      })
    )
    return true
  }

  private waitForNehuba = switchMapWaitFor({
    condition: () => !!(this.nehubaContainerDirective?.isReady())
  }) 

  public toggleMaximiseMinimise(index: number) {
    this.store$.dispatch(
      userInterface.actions.toggleMaximiseView({
        targetIndex: index
      })
    )
  }

  public zoomNgView(panelIndex: number, factor: number) {
    const ngviewer = this.nehubaContainerDirective?.nehubaViewerInstance?.nehubaViewer?.ngviewer
    if (!ngviewer) throw new Error(`ngviewer not defined!`)

    /**
     * panelIndex < 3 === slice view
     */
    if (panelIndex < 3) {
      /**
       * factor > 1 === zoom out
       */
      ngviewer.navigationState.zoomBy(factor)
    } else {
      ngviewer.perspectiveNavigationState.zoomBy(factor)
    }
  }

  private removeExistingPanels() {
    const element = this.nehubaContainerDirective.nehubaViewerInstance.nehubaViewer.ngviewer.layout.container.componentValue.element as HTMLElement
    while (element.childElementCount > 0) {
      element.removeChild(element.firstElementChild)
    }
    return element
  }

  private droppedLayerNames: {
    layerName: string
    resourceUrl: string
  }[] = []
  private dismissAllAddedLayers(){
    while (this.droppedLayerNames.length) {
      const { resourceUrl, layerName } = this.droppedLayerNames.pop()
      this.store$.dispatch(
        atlasAppearance.actions.removeCustomLayer({
          id: layerName
        })
      )
      
      URL.revokeObjectURL(resourceUrl)
    }
  }
  public async handleFileDrop(files: File[]){
    if (files.length !== 1) {
      this.snackbar.open(INVALID_FILE_INPUT, 'Dismiss', {
        duration: 5000
      })
      return
    }
    const randomUuid = getUuid()
    const file = files[0]

    /**
     * TODO check extension?
     */
     
    this.dismissAllAddedLayers()
    
    // Get file, try to inflate, if files, use original array buffer
    const buf = await file.arrayBuffer()
    let outbuf
    try {
      outbuf = getExportNehuba().pako.inflate(buf).buffer
    } catch (e) {
      console.log('unpack error', e)
      outbuf = buf
    }

    try {
      const { result, ...other } = await this.worker.sendMessage({
        method: 'PROCESS_NIFTI',
        param: {
          nifti: outbuf
        },
        transfers: [ outbuf ]
      })
      
      const { meta, buffer } = result

      const url = URL.createObjectURL(new Blob([ buffer ]))
      this.droppedLayerNames.push({
        layerName: randomUuid,
        resourceUrl: url
      })

      this.store$.dispatch(
        atlasAppearance.actions.addCustomLayer({
          customLayer: {
            id: randomUuid,
            source: `nifti://${url}`,
            shader: getShader({
              colormap: EnumColorMapName.MAGMA,
              lowThreshold: meta.min || 0,
              highThreshold: meta.max || 1
            }),
            clType: 'customlayer/nglayer'
          }
        })
      )
      this.dialog.open(
        this.layerCtrlTmpl,
        {
          data: {
            layerName: randomUuid,
            filename: file.name,
            moreInfoFlag: false,
            min: meta.min || 0,
            max: meta.max || 1,
            warning: meta.warning || []
          },
          hasBackdrop: false,
          disableClose: true,
          position: {
            top: '0em'
          },
          autoFocus: false,
          panelClass: [
            'no-padding-dialog',
            'w-100'
          ]
        }
      ).afterClosed().subscribe(
        () => this.dismissAllAddedLayers()
      )
    } catch (e) {
      console.error(e)
      this.snackbar.open(`Error loading nifti: ${e.toString()}`, 'Dismiss', {
        duration: 5000
      })
    }
  }


  public returnTruePos(quadrant: number, data: any) {
    const pos = quadrant > 2
      ? [0, 0, 0]
      : this.nanometersToOffsetPixelsFn && this.nanometersToOffsetPixelsFn[quadrant]
        ? this.nanometersToOffsetPixelsFn[quadrant](data.geometry.position.map(n => n * 1e6))
        : [0, 0, 0]
    return pos
  }

  public getPositionX(quadrant: number, data: any) {
    return this.returnTruePos(quadrant, data)[0]
  }
  public getPositionY(quadrant: number, data: any) {
    return this.returnTruePos(quadrant, data)[1]
  }
  public getPositionZ(quadrant: number, data: any) {
    return this.returnTruePos(quadrant, data)[2]
  }

  public handleMouseEnterCustomLandmark(lm) {
    console.log('handle enter custom landmark')

  }

  public handleMouseLeaveCustomLandmark(_lm) {
    console.log("handle leave custom landmark")

  }

  public quickTourOverwritingPos = {
    'dialog': {
      left: '0px',
      top: '0px',
    },
    'arrow': {
      left: '0px',
      top: '0px',
    }
  }

  setQuickTourPos(){
    const { innerWidth, innerHeight } = window
    this.quickTourOverwritingPos = {
      'dialog': {
        left: `${innerWidth / 2}px`,
        top: `${innerHeight / 2}px`,
      },
      'arrow': {
        left: `${innerWidth / 2 - 48}px`,
        top: `${innerHeight / 2 - 48}px`,
      }
    }
  }
}
