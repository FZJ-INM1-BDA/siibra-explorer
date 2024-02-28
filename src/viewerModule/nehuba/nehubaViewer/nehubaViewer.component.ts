import { Component, ElementRef, EventEmitter, OnDestroy, Output, Inject, Optional } from "@angular/core";
import { Subscription, BehaviorSubject, Observable, Subject, of, interval, combineLatest } from 'rxjs'
import { debounceTime, filter, scan, switchMap, take, distinctUntilChanged, debounce, map } from "rxjs/operators";
import { LoggingService } from "src/logging";
import { bufferUntil, getExportNehuba, getUuid, switchMapWaitFor } from "src/util/fn";
import { deserializeSegment, NEHUBA_INSTANCE_INJTKN } from "../util";
import { arrayOrderedEql, rgbToHex } from 'common/util'
import { IMeshesToLoad, SET_MESHES_TO_LOAD, PERSPECTIVE_ZOOM_FUDGE_FACTOR } from "../constants";
import { IColorMap, SET_COLORMAP_OBS, SET_LAYER_VISIBILITY } from "../layerCtrl.service";

/**
 * import of nehuba js files moved to angular.json
 */
import { EXTERNAL_LAYER_CONTROL, IExternalLayerCtl, INgLayerCtrl, NG_LAYER_CONTROL, SET_SEGMENT_VISIBILITY, TNgLayerCtrl, Z_TRAVERSAL_MULTIPLIER } from "../layerCtrl.service/layerCtrl.util";
import { NgCoordinateSpace, Unit } from "../types";
import { PeriodicSvc } from "src/util/periodic.service";
import { ViewerInternalStateSvc, AUTO_ROTATE } from "src/viewerModule/viewerInternalState.service";

function translateUnit(unit: Unit) {
  if (unit === "m") {
    return 1e9
  }

  throw new Error(`Cannot translate unit: ${unit}`)
}

export const IMPORT_NEHUBA_INJECT_TOKEN = `IMPORT_NEHUBA_INJECT_TOKEN`

interface LayerLabelIndex {
  layer: {
    name: string
  }

  labelIndicies: number[]
}

export const scanFn = (acc: LayerLabelIndex[], curr: LayerLabelIndex) => {
  const found = acc.find(layerLabelIndex => {
    return layerLabelIndex.layer.name === curr.layer.name
  })
  if (!found) {
    return [ ...acc, curr ]
  }
  return acc.map(layerLabelIndex => {
    return layerLabelIndex.layer.name === curr.layer.name
      ? curr
      : layerLabelIndex
  })
}

/**
 * no selector is needed, as currently, nehubaviewer is created dynamically
 */
@Component({
  templateUrl : './nehubaViewer.template.html',
  styleUrls : [
    './nehubaViewer.style.css',
  ],
})

export class NehubaViewerUnit implements OnDestroy {

  #translateVoxelToReal: (voxels: number[]) => number[]

  public ngIdSegmentsMap: Record<string, number[]> = {}

  public viewerPosInVoxel$ = new BehaviorSubject<number[]>(null)
  public viewerPosInReal$ = new BehaviorSubject<[number, number, number]>(null)
  public mousePosInVoxel$ = new BehaviorSubject<[number, number, number]>(null)
  public mousePosInReal$ = new BehaviorSubject<[number, number, number]>(null)

  private exportNehuba: any

  private subscriptions: Subscription[] = []

  private _nehubaReady = false
  @Output() public nehubaReady: EventEmitter<null> = new EventEmitter()
  @Output() public layersChanged: EventEmitter<null> = new EventEmitter()
  private layersChangedHandler: any
  @Output() public viewerPositionChange: EventEmitter<{ orientation: number[], perspectiveOrientation: number[], perspectiveZoom: number, zoom: number, position: number[], positionReal?: boolean }> = new EventEmitter()
  @Output() public mouseoverSegmentEmitter:
    EventEmitter<{
      segmentId: number | null
      layer: {
        name?: string
        url?: string
      }
    }> = new EventEmitter()

  @Output() public regionSelectionEmitter: EventEmitter<{
    segment: number
    layer: {
      name?: string
      url?: string
  }}> = new EventEmitter()
  @Output() public errorEmitter: EventEmitter<any> = new EventEmitter()

  @Output() public totalMeshesToLoad = new EventEmitter<number>()

  /* only used to set initial navigation state */
  public initNav: any

  public config: any
  public nehubaViewer: any
  private _dim: [number, number, number]
  get dim() {
    return this._dim
      ? this._dim
      : [1.5e9, 1.5e9, 1.5e9]
  }

  #newViewerSubs: { unsubscribe: () => void }[] = []

  public ondestroySubscriptions: Subscription[] = []

  public nehubaLoaded: boolean = false

  #triggerMeshLoad$ = new BehaviorSubject(null)

  multplier = new Float32Array(1)

  constructor(
    public elementRef: ElementRef,
    private log: LoggingService,
    private periodicSvc: PeriodicSvc,
    @Inject(IMPORT_NEHUBA_INJECT_TOKEN) getImportNehubaPr: () => Promise<any>,
    @Optional() @Inject(NEHUBA_INSTANCE_INJTKN) private nehubaViewer$: Subject<NehubaViewerUnit>,
    @Optional() @Inject(SET_MESHES_TO_LOAD) private injSetMeshesToLoad$: Observable<IMeshesToLoad>,
    @Optional() @Inject(SET_COLORMAP_OBS) private setColormap$: Observable<IColorMap>,
    @Optional() @Inject(SET_LAYER_VISIBILITY) private layerVis$: Observable<string[]>,
    @Optional() @Inject(SET_SEGMENT_VISIBILITY) private segVis$: Observable<string[]>,
    @Optional() @Inject(NG_LAYER_CONTROL) private layerCtrl$: Observable<TNgLayerCtrl<keyof INgLayerCtrl>>,
    @Optional() @Inject(Z_TRAVERSAL_MULTIPLIER) multiplier$: Observable<number>,
    @Optional() @Inject(EXTERNAL_LAYER_CONTROL) private externalLayerCtrl: IExternalLayerCtl,
    @Optional() intViewerStateSvc: ViewerInternalStateSvc,
  ) {
    if (multiplier$) {
      this.ondestroySubscriptions.push(
        multiplier$.subscribe(val => this.multplier[0] = val)
      )
    } else {
      this.multplier[0] = 1
    }

    if (intViewerStateSvc) {
      let raqRef: number
      const {
        done,
        next,
      } = intViewerStateSvc.registerEmitter({
        "@type": "TViewerInternalStateEmitter",
        viewerType: "nehuba",
        applyState: arg => {
          
          if (arg.viewerType === AUTO_ROTATE) {
            if (raqRef) {
              cancelAnimationFrame(raqRef)
            }
            const autoPlayFlag = (arg.payload as any).play
            const reverseFlag = (arg.payload as any).reverse
            const autoplaySpeed = (arg.payload as any).speed
            
            if (!autoPlayFlag) {
              return
            }
            const deg = (reverseFlag ? 1 : -1) * autoplaySpeed * 1e-3
            const animate = () => {
              raqRef = requestAnimationFrame(() => {
                animate()
              })
              const perspectivePose = this.nehubaViewer?.ngviewer?.perspectiveNavigationState?.pose
              if (!perspectivePose) {
                return
              }
              perspectivePose.rotateAbsolute([0, 0, 1], deg, [0, 0, 0])
            }

            animate()
            return
          }
        }
      })

      this.onDestroyCb.push(() => done())
      next({
        "@id": getUuid(),
        '@type': "TViewerInternalStateEmitterEvent",
        viewerType: "nehuba",
        payload: {}
      })
    }

    if (this.nehubaViewer$) {
      this.nehubaViewer$.next(this)
    }

    getImportNehubaPr()
      .then(() => getExportNehuba())
      .then(exportNehuba => {
        this.nehubaLoaded = true
        this.exportNehuba = exportNehuba
        const fixedZoomPerspectiveSlices = this.config && this.config.layout && this.config.layout.useNehubaPerspective && this.config.layout.useNehubaPerspective.fixedZoomPerspectiveSlices
        if (fixedZoomPerspectiveSlices) {
          const { sliceZoom, sliceViewportWidth, sliceViewportHeight } = fixedZoomPerspectiveSlices
          const dim = Math.min(sliceZoom * sliceViewportWidth, sliceZoom * sliceViewportHeight)
          this._dim = [dim, dim, dim]
        }
        this.patchNG()
        this.loadNehuba()

        const viewer = this.nehubaViewer.ngviewer

        this.layersChangedHandler = viewer.layerManager.readyStateChanged.add(() => {
          this.layersChanged.emit(null)
          const readiedLayerNames: string[] = viewer.layerManager.managedLayers.filter(l => l.isReady()).map(l => l.name)
          for (const layerName in this.ngIdSegmentsMap) {
            if (!readiedLayerNames.includes(layerName)) {
              return
            }
          }
          this._nehubaReady = true
          this.nehubaReady.emit(null)
        })
        viewer.registerDisposer(this.layersChangedHandler)
      })
      .catch(e => this.errorEmitter.emit(e))

    if (this.setColormap$) {
      this.ondestroySubscriptions.push(
        this.setColormap$.pipe(
          switchMap(switchMapWaitFor({
            condition: () => this._nehubaReady
          })),
          debounceTime(160),
        ).subscribe(v => {
          const map = new Map()
          for (const key in v) {
            const m = new Map()
            map.set(key, m)
            for (const lblIdx in v[key]) {
              m.set(lblIdx, v[key][lblIdx])
            }
          }
          this.setColorMap(map)
        })
      )
    } else {
      this.log.error(`SET_COLORMAP_OBS not provided`)
    }

    if (this.layerVis$) {
      this.ondestroySubscriptions.push(
        this.layerVis$.pipe(
          switchMap(switchMapWaitFor({
            condition: () => this._nehubaReady
          })),
          distinctUntilChanged(arrayOrderedEql),
          debounceTime(160),
        ).subscribe((layerNames: string[]) => {
          /**
           * debounce 160ms to set layer invisible etc
           * on switch from freesurfer -> volumetric viewer, race con results in managed layer not necessarily setting layer visible correctly
           */
          const managedLayers = this.nehubaViewer.ngviewer.layerManager.managedLayers
          managedLayers.forEach(layer => {
            if (this.externalLayerCtrl && this.externalLayerCtrl.ExternalLayerNames.has(layer.name)) {
              return
            }
            layer.setVisible(false)
          })
          
          for (const layerName of layerNames) {
            const layer = this.nehubaViewer.ngviewer.layerManager.getLayerByName(layerName)
            if (layer) {
              layer.setVisible(true)
            } else {
              this.log.log('layer unavailable', layerName)
            }
          }
        })
      )
    } else {
      this.log.error(`SET_LAYER_VISIBILITY not provided`)
    }

    if (this.segVis$) {
      this.ondestroySubscriptions.push(
        this.segVis$.pipe(
          switchMap(
            switchMapWaitFor({
              condition: () => this._nehubaReady,
              leading: true,
            })
          )
        ).subscribe(val => {
          // null === hide all seg
          if (val === null) {
            this.hideAllSeg()
            return
          }
          // empty array === show all seg
          if (val.length === 0) {
            this.showAllSeg()
            return
          }
          // show limited seg
          this.showSegs(val)
        })
      )
    } else {
      this.log.error(`SET_SEGMENT_VISIBILITY not provided`)
    }

    if (this.layerCtrl$) {
      this.ondestroySubscriptions.push(
        this.layerCtrl$.pipe(
          bufferUntil(({
            condition: () => this._nehubaReady
          }))
        ).subscribe(messages => {
          for (const message of messages) {
            if (message.type === 'add') {
              const p = message as TNgLayerCtrl<'add'>
              this.loadLayer(p.payload)
            }
            if (message.type === 'remove') {
              const p = message as TNgLayerCtrl<'remove'>
              for (const name of p.payload.names){
                this.removeLayer({ name })
              }
            }
            if (message.type === 'update') {
              const p = message as TNgLayerCtrl<'update'>
              this.updateLayer(p.payload)
            }
            if (message.type === 'setLayerTransparency') {
              const p = message as TNgLayerCtrl<'setLayerTransparency'>
              for (const key in p.payload) {
                this.setLayerTransparency(key, p.payload[key])
              }
            }
            if (message.type === "updateShader") {
              const p = message as TNgLayerCtrl<'updateShader'>
              for (const key in p.payload) {
                this.setLayerShader(key, p.payload[key])
              }
            }
          }
        })
      )
    } else {
      this.log.error(`NG_LAYER_CONTROL not provided`)
    }

    if (this.injSetMeshesToLoad$) {
      this.subscriptions.push(
        combineLatest([
          this.#triggerMeshLoad$,
          this.injSetMeshesToLoad$.pipe(
            scan(scanFn, []),
          ),
        ]).pipe(
          map(([_, val]) => val),
          debounce(() => this._nehubaReady
            ? of(true)
            : interval(160).pipe(
              filter(() => this._nehubaReady),
              take(1),
            )
          ),
        ).subscribe(layersLabelIndex => {
          let totalMeshes = 0
          for (const layerLayerIndex of layersLabelIndex) {
            const { layer, labelIndicies } = layerLayerIndex
            totalMeshes += labelIndicies.length
            this.nehubaViewer.setMeshesToLoad(labelIndicies, layer)
          }
          this.totalMeshesToLoad.emit(totalMeshes)
        }),
      )
    } else {
      this.log.error(`SET_MESHES_TO_LOAD not provided`)
    }
  }

  public applyGpuLimit(gpuLimit: number) {
    if (gpuLimit && this.nehubaViewer) {
      const limit = this.nehubaViewer.ngviewer.state.children.get('gpuMemoryLimit')
      if (limit && limit.restoreState) {
        limit.restoreState(gpuLimit)
      }
    }
  }

  private _multiNgIdColorMap: Map<string, Map<number, {red: number, green: number, blue: number}>>
  get multiNgIdColorMap() {
    return this._multiNgIdColorMap
  }

  set multiNgIdColorMap(val) {
    this._multiNgIdColorMap = val
  }

  public mouseOverSegment: number | null
  public mouseOverLayer: {name: string, url: string}| null

  public getNgHash: () => string = () => this.exportNehuba
    ? this.exportNehuba.getNgHash()
    : null

  public loadNehuba() {
    
    const { createNehubaViewer } = this.exportNehuba

    this.nehubaViewer = createNehubaViewer(this.config, (err: string) => {
      /* print in debug mode */
      this.log.error(err)
    });

    (window as any).nehubaViewer = this.nehubaViewer

    const viewer = window['viewer']

    /**
     * Hide all layers except the base layer (template)
     * Then show the layers referenced in multiNgIdLabelIndexMap
     */
    const patchSliceview = async () => {
      
      viewer.inputEventBindings.sliceView.set("at:wheel", "proxy-wheel")
      viewer.inputEventBindings.sliceView.set("at:control+shift+wheel", "proxy-wheel-alt")
      await (async () => {
        let lenPanels = 0

        while (lenPanels === 0) {
          lenPanels = viewer.display.panels.size
          /* creation of the layout is done on next frame, hence the settimeout */
          await new Promise(rs => setTimeout(rs, 150))
        }
      })()
      viewer.inputEventBindings.sliceView.set("at:wheel", "proxy-wheel-1")
      viewer.inputEventBindings.sliceView.set("at:keyp", "proxy-wheel-1")
      viewer.inputEventBindings.sliceView.set("at:keyn", "proxy-wheel-1")
      viewer.inputEventBindings.sliceView.set("at:control+shift+wheel", "proxy-wheel-10")
      viewer.display.panels.forEach(sliceView => patchSliceViewPanel(sliceView, this.exportNehuba, this.multplier))
    }

    viewer.inputEventBindings.sliceView.set("at:touchhold1", { action: "noop", stopPropagation: false })
    viewer.inputEventBindings.perspectiveView.set("at:touchhold1", { action: "noop", stopPropagation: false })
    patchSliceview()

    this.newViewerInit()
    window['nehubaViewer'] = this.nehubaViewer

    this.onDestroyCb.push(() => {
      window['nehubaViewer'] = null
    })
  }

  public ngOnDestroy() {
    if (this.nehubaViewer$) {
      this.nehubaViewer$.next(null)
    }
    while (this.subscriptions.length > 0) {
      this.subscriptions.pop().unsubscribe()
    }
    while (this.#newViewerSubs.length > 0) {
      this.#newViewerSubs.pop().unsubscribe()
    }
    
    this.ondestroySubscriptions.forEach(s => s.unsubscribe())
    while (this.onDestroyCb.length > 0) {
      this.onDestroyCb.pop()()
    }
    this.nehubaViewer && this.nehubaViewer.dispose()
  }

  private onDestroyCb: Array<() => void> = []

  private patchNG() {

    const { LayerManager, UrlHashBinding } = this.exportNehuba.getNgPatchableObj()

    UrlHashBinding.prototype.setUrlHash = () => {
      // this.log.log('seturl hash')
      // this.log.log('setting url hash')
    }

    UrlHashBinding.prototype.updateFromUrlHash = () => {
      // this.log.log('update hash binding')
    }

    /* TODO find a more permanent fix to disable double click */
    LayerManager.prototype.invokeAction = (arg) => {

      /**
       * The emitted value does not affect the region selection
       * the region selection is taken care of in nehubaContainer
       */
      
      if (arg === 'select') {
        this.regionSelectionEmitter.emit({
          segment: this.mouseOverSegment,
          layer: this.mouseOverLayer
        })
      }
    }

    /* eslint-disable-next-line @typescript-eslint/no-empty-function */
    this.onDestroyCb.push(() => LayerManager.prototype.invokeAction = (_arg) => { /** in default neuroglancer, this function is invoked when selection occurs */ })
  }

  private filterLayers(l: any, layerObj: any): boolean {
    /**
     * if selector is an empty object, select all layers
     */
    return layerObj instanceof Object && Object.keys(layerObj).every(key =>
      /**
       * the property described by the selector must exist and ...
       */
      !!l[key] &&
        /**
         * if the selector is regex, test layer property
         */
        ( layerObj[key] instanceof RegExp
          ? layerObj[key].test(l[key])
          /**
           * if selector is string, test for strict equality
           */
          : typeof layerObj[key] === 'string'
            ? layerObj[key] === l[key]
            /**
             * otherwise do not filter
             */
            : false
        ),
    )
  }

  public setLayerVisibility(condition: {name: string|RegExp}, visible: boolean) {
    if (!this.nehubaViewer) {
      return false
    }
    const viewer = this.nehubaViewer.ngviewer
    viewer.layerManager.managedLayers
      .filter(l => this.filterLayers(l, condition))
      .map(layer => layer.setVisible(visible))
  }

  public removeLayer(layerObj: any) {
    if (!this.nehubaViewer) {
      return false
    }
    const viewer = this.nehubaViewer.ngviewer
    const removeLayer = (i) => (viewer.layerManager.removeManagedLayer(i), i.name)

    return viewer.layerManager.managedLayers
      .filter(l => this.filterLayers(l, layerObj))
      .map(removeLayer)
  }

  public loadLayer(layerObj: any) {
    const viewer = this.nehubaViewer.ngviewer
    return Object.keys(layerObj)
      .filter(key =>
        /* if the layer exists, it will not be loaded */
        !viewer.layerManager.getLayerByName(key))
      .map(key => {
        /**
         * new implementation of neuroglancer treats swc as a mesh layer of segmentation layer
         * But it cannot *directly* be accessed by nehuba's setMeshesToLoad, since it filters by 
         * UserSegmentationLayer.
         * 
         * The below monkey patch sets the mesh to load, allow the SWC to be shown
         */
        let url = layerObj[key]['source']
        if (typeof url !== "string") {
          url = url['url']
        }
        const isSwc = url.includes("swc://")
        const hasSegment = (layerObj[key]["segments"] || []).length > 0
        if (isSwc && hasSegment) {
          this.periodicSvc.addToQueue(
            () => {
              const layer = viewer.layerManager.getLayerByName(key)
              if (!(layer?.layer)) {
                return false
              }
              layer.layer.displayState.visibleSegments.setMeshesToLoad([1])
              return true
            }
          )
        }
        const { transform=null, ...rest } = layerObj[key]

        const combined = {
          type: 'image',
          opacity: 1,
          ...rest,
          ...(transform ? { transform } : {})
        }
        viewer.layerManager.addManagedLayer(
          viewer.layerSpecification.getLayer(key, combined), 1)

        return layerObj[key]
      })
  }

  public updateLayer(layerObj: INgLayerCtrl['update']) {

    const viewer = this.nehubaViewer.ngviewer

    for (const layerName in layerObj) {
      const layer = viewer.layerManager.getLayerByName(layerName)
      if (!layer) continue
      const { visible } = layerObj[layerName]
      layer.setVisible(!!visible)
    }
  }

  public hideAllSeg() {
    if (!this.nehubaViewer) return
    for (const ngId in this.ngIdSegmentsMap) {
      for (const idx of this.ngIdSegmentsMap[ngId]) {
        this.nehubaViewer.hideSegment(idx, {
          name: ngId,
        })
      }
      this.nehubaViewer.showSegment(0, {
        name: ngId,
      })
    }
  }

  public showAllSeg() {
    if (!this.nehubaViewer) { return }
    for (const ngId in this.ngIdSegmentsMap) {
      for (const idx of this.ngIdSegmentsMap[ngId]) {
        this.nehubaViewer.showSegment(idx, {
          name: ngId,
        })
      }
      this.nehubaViewer.hideSegment(0, {
        name: ngId,
      })
    }
  }

  public showSegs(array: (number|string)[]) {

    if (!this.nehubaViewer) { return }

    this.hideAllSeg()

    if (array.length === 0) { return }

    /**
     * TODO tobe deprecated
     */

    if (typeof array[0] === 'number') {
      this.log.warn(`show seg with number indices has been deprecated`)
      return
    }

    const reduceFn: (acc: Map<string, number[]>, curr: string) => Map<string, number[]> = (acc, curr) => {

      const newMap = new Map(acc)
      const { ngId, label: labelIndex } = deserializeSegment(curr)
      const exist = newMap.get(ngId)
      if (!exist) {
        newMap.set(ngId, [Number(labelIndex)])
      } else {
        newMap.set(ngId, [...exist, Number(labelIndex)])
      }
      return newMap
    }

    const newMap: Map<string, number[]> = array.reduce(reduceFn, new Map())

    /**
     * TODO
     * ugh, ugly code. cleanify
     */
    /**
     * TODO
     * sometimes, ngId still happends to be undefined
     */
    newMap.forEach((segs, ngId) => {
      this.nehubaViewer.hideSegment(0, {
        name: ngId,
      })
      segs.forEach(seg => {
        this.nehubaViewer.showSegment(seg, {
          name: ngId,
        })
      })
    })
  }

  private vec3(pos: number[]) {
    return this.exportNehuba.vec3.fromValues(...pos)
  }

  public setNavigationState(newViewerState: Partial<ViewerState>) {

    if (!this.nehubaViewer) {
      this.log.warn('setNavigationState > this.nehubaViewer is not yet defined')
      return
    }

    const {
      orientation,
      perspectiveOrientation,
      perspectiveZoom,
      position,
      positionReal,
      zoom,
    } = newViewerState || {}

    if ( perspectiveZoom ) {
      this.nehubaViewer.ngviewer.perspectiveNavigationState.zoomFactor.restoreState(perspectiveZoom * PERSPECTIVE_ZOOM_FUDGE_FACTOR)
    }
    if ( zoom ) {
      this.nehubaViewer.ngviewer.navigationState.zoomFactor.restoreState(zoom)
    }
    if ( perspectiveOrientation ) {
      this.nehubaViewer.ngviewer.perspectiveNavigationState.pose.orientation.restoreState( perspectiveOrientation )
    }
    if ( orientation ) {
      this.nehubaViewer.ngviewer.navigationState.pose.orientation.restoreState( orientation )
    }
    if ( position ) {
      this.nehubaViewer.setPosition( this.vec3(position) , positionReal ? true : false )
    }
  }

  public toggleOctantRemoval(flag?: boolean) {
    const ctrl = this.nehubaViewer?.ngviewer?.showPerspectiveSliceViews
    if (!ctrl) {
      this.log.error(`toggleOctantRemoval failed. this.nehubaViewer.ngviewer?.showPerspectiveSliceViews returns falsy`)
      return
    }
    const newVal = typeof flag === 'undefined'
      ? !ctrl.value
      : flag
    ctrl.restoreState(newVal)
  }

  private setLayerTransparency(layerName: string, alpha: number) {
    const layer = this.nehubaViewer.ngviewer.layerManager.getLayerByName(layerName)
    if (!(layer?.layer)) return

    /**
     * for segmentation layer
     */
    if (layer.layer.displayState) layer.layer.displayState.objectAlpha.restoreState(alpha)
    /**
     * for image layer
     */
    if (layer.layer.opacity) layer.layer.opacity.restoreState(alpha)
  }

  private setLayerShader(layerName: string, shader: string) {
    const layer = this.nehubaViewer.ngviewer.layerManager.getLayerByName(layerName)
    if (layer?.layer?.fragmentMain) layer.layer.fragmentMain.restoreState(shader)
  }

  public setMeshTransparency(flag: boolean){

    /**
     * remove transparency from meshes in current layer(s)
     */
    for (const layerKey in this.ngIdSegmentsMap) {
      const layer = this.nehubaViewer.ngviewer.layerManager.getLayerByName(layerKey)
      if (layer) {
        layer.layer.displayState.objectAlpha.restoreState(flag ? 0.2 : 1.0)
      }
    }
  }

  public redraw(){
    this.nehubaViewer.redraw()
  }

  private newViewerInit() {
    
    while (this.#newViewerSubs.length > 0) {
      this.#newViewerSubs.pop().unsubscribe()
    }

    this.#newViewerSubs.push(

      /* isn't this layer specific? */
      /* TODO this is layer specific. need a way to distinguish between different segmentation layers */
      this.nehubaViewer.mouseOver.segment.subscribe(({ segment, layer }) => {
        this.mouseOverSegment = segment
        this.mouseOverLayer = { ...layer }
      }),

      this.nehubaViewer.mouseOver.segment.subscribe(({segment: segmentId, layer }) => {
        this.mouseoverSegmentEmitter.emit({
          layer,
          segmentId,
        })
      }),

      // nehubaViewer.navigationState.all emits every time a new layer is added or removed from the viewer
      this.nehubaViewer.navigationState.all
      .distinctUntilChanged((a, b) => {
        const {
          orientation: o1,
          perspectiveOrientation: po1,
          perspectiveZoom: pz1,
          position: p1,
          zoom: z1,
        } = a
        const {
          orientation: o2,
          perspectiveOrientation: po2,
          perspectiveZoom: pz2,
          position: p2,
          zoom: z2,
        } = b

        return [0, 1, 2, 3].every(idx => o1[idx] === o2[idx]) &&
          [0, 1, 2, 3].every(idx => po1[idx] === po2[idx]) &&
          pz1 === pz2 &&
          [0, 1, 2].every(idx => p1[idx] === p2[idx]) &&
          z1 === z2
      })
      /**
       * somewhat another fudge factor
       * navigationState.all occassionally emits slice zoom and perspective zoom that maeks no sense
       * filter those out
       * 
       * TODO find out why, and perhaps inform pavel about this
       */
      .filter(val => !this.initNav && val?.perspectiveZoom > 10)
      .subscribe(({ orientation, perspectiveOrientation, perspectiveZoom, position, zoom }) => {

        this.viewerPositionChange.emit({
          orientation : Array.from(orientation),
          perspectiveOrientation : Array.from(perspectiveOrientation),
          perspectiveZoom: perspectiveZoom / PERSPECTIVE_ZOOM_FUDGE_FACTOR,
          zoom,
          position: Array.from(position),
          positionReal : true,
        })
      }),

      this.nehubaViewer.navigationState.position.inVoxels
        .filter(v => typeof v !== 'undefined' && v !== null)
        .subscribe((v: Float32Array) => {
          const coordInVoxel = Array.from(v)
          this.viewerPosInVoxel$.next(coordInVoxel)
          if (this.#translateVoxelToReal) {
            
            const coordInReal = this.#translateVoxelToReal(coordInVoxel)
            this.viewerPosInReal$.next(coordInReal as [number, number, number])
          }
        }),

      this.nehubaViewer.mousePosition.inVoxels
        .filter((v: Float32Array) => typeof v !== 'undefined' && v !== null)
        .subscribe((v: Float32Array) => {
          const coordInVoxel = Array.from(v) as [number, number, number]
          this.mousePosInVoxel$.next( coordInVoxel )
          if (this.#translateVoxelToReal) {
            
            const coordInReal = this.#translateVoxelToReal(coordInVoxel)
            this.mousePosInReal$.next( coordInReal as [number, number, number] )
          }
        }),

    )

    const coordSpListener = this.nehubaViewer.ngviewer.coordinateSpace.changed.add(() => {
      const coordSp = this.nehubaViewer.ngviewer.coordinateSpace.value as NgCoordinateSpace
      if (coordSp.valid) {
        this.#translateVoxelToReal = (coordInVoxel: number[]) => {
          return coordInVoxel.map((voxel, idx) => (
            translateUnit(coordSp.units[idx])
            * coordSp.scales[idx]
            * voxel
          ))
        }
      }
    })
    this.nehubaViewer.ngviewer.registerDisposer(coordSpListener)

    if (this.initNav) {
      this.setNavigationState(this.initNav)
      this.initNav = null
    }
    
  }

  private setColorMap(map: Map<string, Map<number, {red: number, green: number, blue: number}>>) {
    this.multiNgIdColorMap = map
    const mainDict: Record<string, Record<number, string>> = {}
    for (const [ ngId, cMap ] of map.entries()) {
      const nRecord: Record<number, string> = {}
      for (const [ key, cm ] of cMap.entries()) {
        nRecord[key] = rgbToHex([cm.red, cm.green, cm.blue])
      }
      mainDict[ngId] = nRecord

      /**
       * n.b.
       * cannot restoreState on each individual layer
       * it seems to create duplicated datasources, which eats memory, and wrecks opacity
       */
    }

    /**
     * n.b. 2
     * updating layer colormap seems to also mess up the position ()
     */

    const layersManager = this.nehubaViewer.ngviewer.state.children.get("layers")
    const position = this.nehubaViewer.ngviewer.state.children.get("position")
    const prevPos = position.toJSON()
    const layerJson = layersManager.toJSON()
    for (const layer of layerJson) {
      if (layer.name in mainDict) {
        layer['segmentColors'] = mainDict[layer.name]
      }
    }
    layersManager.restoreState(layerJson)
    position.restoreState(prevPos)
    this.#triggerMeshLoad$.next(null)
  }
}


const noop = (_event: MouseEvent) => {
  // TODO either emit contextmenu
  // or capture longtouch on higher level as contextmenu
  // at the moment, this is required to override default behavior (move to cursur location)
}

const patchSliceViewPanel = (sliceViewPanel: any, exportNehuba: any, mulitplier: Float32Array) => {

  // patch draw calls to dispatch viewerportToData
  const originalDraw = sliceViewPanel.draw
  sliceViewPanel.draw = function(this) {

    if (this.sliceView) {
      const viewportToDataEv = new CustomEvent('viewportToData', {
        bubbles: true,
        detail: {
          viewportToData : this.sliceView.invViewMatrix,
        },
      })
      this.element.dispatchEvent(viewportToDataEv)
    }

    originalDraw.call(this)
  }

  // patch ctrl+wheel & shift+wheel
  const { navigationState } = sliceViewPanel
  const { registerActionListener, vec3 } = exportNehuba
  const tempVec3 = vec3.create()

  for (const val of [1, 10]) {
    registerActionListener(sliceViewPanel.element, `proxy-wheel-${val}`, event => {
      const e = event.detail

      let keyDelta = null
      if (e.key === "p") {
        keyDelta = -1
      }
      if (e.key === "n") {
        keyDelta = 1
      }
      const offset = tempVec3
      const wheelDelta = e.deltaY !== 0 ? e.deltaY : e.deltaX
      
      const delta = keyDelta ?? wheelDelta

      offset[0] = 0
      offset[1] = 0
      offset[2] = (delta > 0 ? -1 : 1) * mulitplier[0] * val
      navigationState.pose.translateVoxelsRelative(offset)
    })
  }

  registerActionListener(sliceViewPanel.element, `noop`, noop)
}

export interface ViewerState {
  orientation: number[]
  perspectiveOrientation: number[]
  perspectiveZoom: number
  position: number[]
  positionReal: boolean
  zoom: number
}

export const computeDistance = (pt1: [number, number], pt2: [number, number]) => ((pt1[0] - pt2[0]) ** 2 + (pt1[1] - pt2[1]) ** 2) ** 0.5
