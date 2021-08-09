import { AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges, OnDestroy, Optional, Output, SimpleChanges, ViewChild } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { asyncScheduler, combineLatest, fromEvent, merge, NEVER, Observable, of, Subject } from "rxjs";
import { ngViewerActionToggleMax } from "src/services/state/ngViewerState/actions";
import { ClickInterceptor, CLICK_INTERCEPTOR_INJECTOR } from "src/util";
import { uiStateMouseOverSegmentsSelector } from "src/services/state/uiState/selectors";
import { debounceTime, distinctUntilChanged, filter, map, mapTo, scan, shareReplay, startWith, switchMap, switchMapTo, take, tap, throttleTime } from "rxjs/operators";
import { viewerStateAddUserLandmarks, viewerStateChangeNavigation, viewerStateMouseOverCustomLandmark, viewerStateSelectRegionWithIdDeprecated, viewerStateSetSelectedRegions, viewreStateRemoveUserLandmarks } from "src/services/state/viewerState/actions";
import { ngViewerSelectorPanelOrder, ngViewerSelectorPanelMode } from "src/services/state/ngViewerState/selectors";
import { viewerStateCustomLandmarkSelector, viewerStateNavigationStateSelector } from "src/services/state/viewerState/selectors";
import { serialiseParcellationRegion } from 'common/util'
import { ARIA_LABELS, IDS, QUICKTOUR_DESC } from 'common/constants'
import { PANELS } from "src/services/state/ngViewerState/constants";
import { LoggingService } from "src/logging";

import { getMultiNgIdsRegionsLabelIndexMap, SET_MESHES_TO_LOAD } from "../constants";
import { EnumViewerEvt, IViewer, TViewerEvent } from "../../viewer.interface";
import { NehubaViewerUnit } from "../nehubaViewer/nehubaViewer.component";
import { NehubaViewerContainerDirective, TMouseoverEvent } from "../nehubaViewerInterface/nehubaViewerInterface.directive";
import { cvtNavigationObjToNehubaConfig, getFourPanel, getHorizontalOneThree, getSinglePanel, getVerticalOneThree, scanSliceViewRenderFn, takeOnePipe } from "../util";
import { API_SERVICE_SET_VIEWER_HANDLE_TOKEN, TSetViewerHandle } from "src/atlasViewer/atlasViewer.apiService.service";
import { MouseHoverDirective } from "src/mouseoverModule";
import { NehubaMeshService } from "../mesh.service";
import { IQuickTourData } from "src/ui/quickTour/constrants";
import { NehubaLayerControlService, IColorMap, SET_COLORMAP_OBS, SET_LAYER_VISIBILITY } from "../layerCtrl.service";
import { getUuid, switchMapWaitFor } from "src/util/fn";
import { INavObj } from "../navigation.service";
import { NG_LAYER_CONTROL, SET_SEGMENT_VISIBILITY } from "../layerCtrl.service/layerCtrl.util";
import { MatSnackBar } from "@angular/material/snack-bar";
import { getShader } from "src/util/constants";
import { EnumColorMapName } from "src/util/colorMaps";

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

export class NehubaGlueCmp implements IViewer<'nehuba'>, OnChanges, OnDestroy, AfterViewInit {

  public ARIA_LABELS = ARIA_LABELS
  public IDS = IDS

  @ViewChild(NehubaViewerContainerDirective, { static: true })
  public nehubaContainerDirective: NehubaViewerContainerDirective

  @ViewChild(MouseHoverDirective, { static: true })
  private mouseoverDirective: MouseHoverDirective

  public viewerLoaded: boolean = false

  private onhoverSegments = []
  private onDestroyCb: Function[] = []
  private viewerUnit: NehubaViewerUnit
  private multiNgIdsRegionsLabelIndexMap: Map<string, Map<number, any>>

  @Input()
  public selectedParcellation: any

  @Input()
  public selectedTemplate: any

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

  public customLandmarks$: Observable<any> = this.store$.pipe(
    select(viewerStateCustomLandmarkSelector),
    map(lms => lms.map(lm => ({
      ...lm,
      geometry: {
        position: lm.position
      }
    }))),
  )

  public filterCustomLandmark(lm: any){
    return !!lm['showInSliceView']
  }

  public panelOrder$ = this.store$.pipe(
    select(ngViewerSelectorPanelOrder),
    distinctUntilChanged(),
    shareReplay(1),
  )

  ngOnChanges(sc: SimpleChanges){
    const {
      selectedParcellation,
      selectedTemplate
    } = sc
    if (selectedTemplate) {
      if (selectedTemplate?.currentValue?.['@id'] !== selectedTemplate?.previousValue?.['@id']) {

        if (selectedTemplate?.previousValue) {
          this.unloadTmpl(selectedTemplate?.previousValue)
        }
        if (selectedTemplate?.currentValue?.['@id']) {
          this.loadTmpl(selectedTemplate.currentValue, selectedParcellation.currentValue)
        }
      }
    }else if (selectedParcellation && selectedParcellation.currentValue !== selectedParcellation.previousValue) {
      this.loadParc(selectedParcellation.currentValue)
    }
  }

  ngAfterViewInit(){
    this.setQuickTourPos()

    const { 
      mouseOverSegments = NEVER,
      navigationEmitter = NEVER,
      mousePosEmitter = NEVER,
    } = this.nehubaContainerDirective || {}
    const sub = combineLatest([
      mouseOverSegments,
      navigationEmitter,
      mousePosEmitter,
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
            nehuba: seg.map(v => {
              return {
                layerName: v.layer.name,
                labelIndices: [ Number(v.segmentId) ]
              }
            })
          }
        }
      })
    })
    this.onDestroyCb.push(
      () => sub.unsubscribe()
    )
  }

  ngOnDestroy() {
    while (this.onDestroyCb.length) this.onDestroyCb.pop()()
  }

  private loadParc(parcellation: any) {
    /**
     * parcellaiton may be undefined
     */
    if ( !(parcellation && parcellation.regions)) {
      return
    }

    this.multiNgIdsRegionsLabelIndexMap = getMultiNgIdsRegionsLabelIndexMap(parcellation)

    this.viewerUnit.multiNgIdsLabelIndexMap = this.multiNgIdsRegionsLabelIndexMap
    this.viewerUnit.auxilaryMeshIndices = parcellation.auxillaryMeshIndices || []

  }

  private unloadTmpl(tmpl: any) {
    /**
     * clear existing container
     */
    this.viewerUnit = null
    this.nehubaContainerDirective.clear()

    /* on selecting of new template, remove additional nglayers */
    const baseLayerNames = Object.keys(tmpl.nehubaConfig.dataset.initialNgState.layers)
    this.layerCtrlService.removeNgLayers(baseLayerNames)
  }

  private async loadTmpl(_template: any, parcellation: any) {

    if (!_template) return
    /**
     * recalcuate zoom
     */
    const template = (() => {

      const deepCopiedState = JSON.parse(JSON.stringify(_template))
      const initialNgState = deepCopiedState.nehubaConfig.dataset.initialNgState

      if (!initialNgState || !this.navigation) {
        return deepCopiedState
      }
      const overwritingInitState = this.navigation
        ? cvtNavigationObjToNehubaConfig(this.navigation, initialNgState)
        : {}

      deepCopiedState.nehubaConfig.dataset.initialNgState = {
        ...initialNgState,
        ...overwritingInitState,
      }
      return deepCopiedState
    })()

    this.nehubaContainerDirective.createNehubaInstance(template)
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
    const foundParcellation = parcellation
      && template?.parcellations?.find(p => parcellation.name === p.name)
    this.loadParc(foundParcellation || template.parcellations[0])

    const nehubaConfig = template.nehubaConfig
    const initialSpec = nehubaConfig.dataset.initialNgState
    const {layers} = initialSpec

    const dispatchLayers = Object.keys(layers).map(key => {
      const layer = {
        name : key,
        source : layers[key].source,
        mixability : layers[key].type === 'image'
          ? 'base'
          : 'mixable',
        visible : typeof layers[key].visible === 'undefined'
          ? true
          : layers[key].visible,
        transform : typeof layers[key].transform === 'undefined'
          ? null
          : layers[key].transform,
      }
      return layer
    })

    this.layerCtrlService.addNgLayer(dispatchLayers)
    this.newViewer$.next(true)
  }

  @Output()
  public viewerEvent = new EventEmitter<TViewerEvent<'nehuba'>>()

  constructor(
    private store$: Store<any>,
    private el: ElementRef,
    private log: LoggingService,
    private snackbar: MatSnackBar,
    @Optional() @Inject(CLICK_INTERCEPTOR_INJECTOR) clickInterceptor: ClickInterceptor,
    @Optional() @Inject(API_SERVICE_SET_VIEWER_HANDLE_TOKEN) setViewerHandle: TSetViewerHandle,
    @Optional() private layerCtrlService: NehubaLayerControlService,
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
     * on layout change
     */
    const redrawLayoutSub = combineLatest([
      this.store$.pipe(
        select(ngViewerSelectorPanelMode),
        distinctUntilChanged(),
        shareReplay(1),
      ),
      this.panelOrder$,
    ]).pipe(
      switchMap(this.waitForNehuba.bind(this))
    ).subscribe(([mode, panelOrder]) => {
      const viewPanels = panelOrder.split('').map(v => Number(v)).map(idx => this.viewPanels[idx]) as [HTMLElement, HTMLElement, HTMLElement, HTMLElement]

      /**
       * TODO smarter with event stream
       */
      if (!viewPanels.every(v => !!v)) {
        this.log.error(`on relayout, not every view panel is populated. This should not occur!`)
        return
      }

      switch (mode) {
      case PANELS.H_ONE_THREE: {
        const element = this.removeExistingPanels()
        const newEl = getHorizontalOneThree(viewPanels)
        element.appendChild(newEl)
        break;
      }
      case PANELS.V_ONE_THREE: {
        const element = this.removeExistingPanels()
        const newEl = getVerticalOneThree(viewPanels)
        element.appendChild(newEl)
        break;
      }
      case PANELS.FOUR_PANEL: {
        const element = this.removeExistingPanels()
        const newEl = getFourPanel(viewPanels)
        element.appendChild(newEl)
        break;
      }
      case PANELS.SINGLE_PANEL: {
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
      select(uiStateMouseOverSegmentsSelector),
      distinctUntilChanged(),
    ).subscribe(arr => {
      const segments = arr.map(({ segment }) => segment).filter(v => !!v)
      this.onhoverSegments = segments
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
        /* TODO introduce animation */
        moveToNavigationLoc : (coord, _realSpace?) => {
          this.store$.dispatch(
            viewerStateChangeNavigation({
              navigation: {
                position: coord,
                animation: {},
              }
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

          // if(!this.selectedRegionIndexSet.has(labelIndex))
          //   this.store.dispatch({
          //     type : SELECT_REGIONS,
          //     selectRegions :  [labelIndex, ...this.selectedRegionIndexSet]
          //   })
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

          this.store$.dispatch(viewerStateAddUserLandmarks({
            landmarks
          }))
        },
        remove3DLandmarks : landmarkIds => {
          this.store$.dispatch(viewreStateRemoveUserLandmarks({
            payload: { landmarkIds }
          }))
        },
        hideSegment : (_labelIndex) => {
          /**
           * TODO reenable with updated select_regions api
           */
          this.log.warn(`hideSegment is temporarily disabled`)

          // if(this.selectedRegionIndexSet.has(labelIndex)){
          //   this.store.dispatch({
          //     type :SELECT_REGIONS,
          //     selectRegions : [...this.selectedRegionIndexSet].filter(num=>num!==labelIndex)
          //   })
          // }
        },
        showAllSegments : () => {
          const selectRegionIds = []
          this.multiNgIdsRegionsLabelIndexMap.forEach((map, ngId) => {
            Array.from(map.keys()).forEach(labelIndex => {
              selectRegionIds.push(serialiseParcellationRegion({ ngId, labelIndex }))
            })
          })
          this.store$.dispatch(viewerStateSelectRegionWithIdDeprecated({
            selectRegionIds
          }))
        },
        hideAllSegments : () => {
          this.store$.dispatch(viewerStateSelectRegionWithIdDeprecated({
            selectRegionIds: []
          }))
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
        mouseOverNehubaLayers: this.mouseoverDirective.currentOnHoverObs$.pipe(
          map(({ segments }) => segments)
        ),
        mouseOverNehubaUI: this.mouseoverDirective.currentOnHoverObs$.pipe(
          map(({ landmark, segments, userLandmark: customLandmark }) => ({ segments, landmark, customLandmark })),
          shareReplay(1),
        ),
        getNgHash : this.nehubaContainerDirective.nehubaViewerInstance.getNgHash,
      })
    })
    this.onDestroyCb.push(() => setupViewerApiSub.unsubscribe())

    // listen to navigation change from store
    const navSub = this.store$.pipe(
      select(viewerStateNavigationStateSelector)
    ).subscribe(nav => this.navigation = nav)
    this.onDestroyCb.push(() => navSub.unsubscribe())
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
      viewerStateSetSelectedRegions({
        selectRegions: trueOnhoverSegments.slice(0, 1)
      })
    )
    return true
  }

  private waitForNehuba = switchMapWaitFor({
    condition: () => !!(this.nehubaContainerDirective?.isReady())
  }) 

  public toggleMaximiseMinimise(index: number) {
    this.store$.dispatch(ngViewerActionToggleMax({
      payload: { index }
    }))
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
      this.layerCtrlService.removeNgLayers([ layerName ])
      URL.revokeObjectURL(resourceUrl)
    }
  }
  public handleFileDrop(files: File[]){
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
    
    const url = URL.createObjectURL(file)
    this.droppedLayerNames.push({
      layerName: randomUuid,
      resourceUrl: url
    })
    this.layerCtrlService.addNgLayer([{
      name: randomUuid,
      mixability: 'mixable',
      source: `nifti://${url}`,
      shader: getShader({
        colormap: EnumColorMapName.MAGMA
      })
    }])

    this.snackbar.open(
      `Viewing ${file.name}`,
      'Clear',
      { duration: 0 }
    ).afterDismissed().subscribe(() => {
      this.dismissAllAddedLayers()
    })
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
    this.store$.dispatch(
      viewerStateMouseOverCustomLandmark({
        payload: { userLandmark: lm }
      })
    )
  }

  public handleMouseLeaveCustomLandmark(_lm) {
    this.store$.dispatch(
      viewerStateMouseOverCustomLandmark({
        payload: { userLandmark: null }
      })
    )
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
