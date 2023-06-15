import { Component, ElementRef, EventEmitter, OnDestroy, Output, Inject, Optional } from "@angular/core";
import { Subscription, BehaviorSubject, Observable, Subject, of, interval, combineLatest } from 'rxjs'
import { debounceTime, filter, scan, switchMap, take, distinctUntilChanged, debounce, map } from "rxjs/operators";
import { LoggingService } from "src/logging";
import { bufferUntil, getExportNehuba, getViewer, setNehubaViewer, switchMapWaitFor } from "src/util/fn";
import { deserializeSegment, NEHUBA_INSTANCE_INJTKN } from "../util";
import { arrayOrderedEql, rgbToHex } from 'common/util'
import { IMeshesToLoad, SET_MESHES_TO_LOAD, PERSPECTIVE_ZOOM_FUDGE_FACTOR } from "../constants";
import { IColorMap, SET_COLORMAP_OBS, SET_LAYER_VISIBILITY } from "../layerCtrl.service";

/**
 * import of nehuba js files moved to angular.json
 */
import { INgLayerCtrl, NG_LAYER_CONTROL, SET_SEGMENT_VISIBILITY, TNgLayerCtrl } from "../layerCtrl.service/layerCtrl.util";

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


  public ngIdSegmentsMap: Record<string, number[]> = {}

  public viewerPosInVoxel$ = new BehaviorSubject<number[]>(null)
  public viewerPosInReal$ = new BehaviorSubject<[number, number, number]>(null)
  public mousePosInVoxel$ = new BehaviorSubject<[number, number, number]>(null)
  public mousePosInReal$ = new BehaviorSubject(null)

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

  public _s2$: any = null
  public _s3$: any = null
  public _s5$: any = null
  public _s7$: any = null
  public _s8$: any = null

  public _s$: any[] = [
    this._s2$,
    this._s3$,
    this._s5$,
    this._s7$,
    this._s8$,
  ]

  public ondestroySubscriptions: Subscription[] = []

  public nehubaLoaded: boolean = false

  #triggerMeshLoad$ = new BehaviorSubject(null)

  constructor(
    public elementRef: ElementRef,
    private log: LoggingService,
    @Inject(IMPORT_NEHUBA_INJECT_TOKEN) getImportNehubaPr: () => Promise<any>,
    @Optional() @Inject(NEHUBA_INSTANCE_INJTKN) private nehubaViewer$: Subject<NehubaViewerUnit>,
    @Optional() @Inject(SET_MESHES_TO_LOAD) private injSetMeshesToLoad$: Observable<IMeshesToLoad>,
    @Optional() @Inject(SET_COLORMAP_OBS) private setColormap$: Observable<IColorMap>,
    @Optional() @Inject(SET_LAYER_VISIBILITY) private layerVis$: Observable<string[]>,
    @Optional() @Inject(SET_SEGMENT_VISIBILITY) private segVis$: Observable<string[]>,
    @Optional() @Inject(NG_LAYER_CONTROL) private layerCtrl$: Observable<TNgLayerCtrl<keyof INgLayerCtrl>>,
  ) {

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
          managedLayers.forEach(layer => layer.setVisible(false))
          
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
    this.nehubaViewer = this.exportNehuba.createNehubaViewer(this.config, (err: string) => {
      /* print in debug mode */
      this.log.error(err)
    });

    (window as any).nehubaViewer = this.nehubaViewer

    /**
     * Hide all layers except the base layer (template)
     * Then show the layers referenced in multiNgIdLabelIndexMap
     */

    /* creation of the layout is done on next frame, hence the settimeout */
    setTimeout(() => {
      getViewer().display.panels.forEach(patchSliceViewPanel)
    })

    this.newViewerInit()
    this.loadNewParcellation()

    setNehubaViewer(this.nehubaViewer)

    this.onDestroyCb.push(() => setNehubaViewer(null))
  }

  public ngOnDestroy() {
    if (this.nehubaViewer$) {
      this.nehubaViewer$.next(null)
    }
    while (this.subscriptions.length > 0) {
      this.subscriptions.pop().unsubscribe()
    }

    this._s$.forEach(_s$ => {
      if (_s$) { _s$.unsubscribe() }
    })
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
        viewer.layerManager.addManagedLayer(
          viewer.layerSpecification.getLayer(key, layerObj[key]))

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

  public obliqueRotateX(amount: number) {
    this.nehubaViewer.ngviewer.navigationState.pose.rotateRelative(this.vec3([0, 1, 0]), -amount / 4.0 * Math.PI / 180.0)
  }

  public obliqueRotateY(amount: number) {
    this.nehubaViewer.ngviewer.navigationState.pose.rotateRelative(this.vec3([1, 0, 0]), amount / 4.0 * Math.PI / 180.0)
  }

  public obliqueRotateZ(amount: number) {
    this.nehubaViewer.ngviewer.navigationState.pose.rotateRelative(this.vec3([0, 0, 1]), amount / 4.0 * Math.PI / 180.0)
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

    /* isn't this layer specific? */
    /* TODO this is layer specific. need a way to distinguish between different segmentation layers */
    this._s2$ = this.nehubaViewer.mouseOver.segment
      .subscribe(({ segment, layer }) => {
        this.mouseOverSegment = segment
        this.mouseOverLayer = { ...layer }
      })

    if (this.initNav) {
      this.setNavigationState(this.initNav)
      this.initNav = null
    }

    this._s8$ = this.nehubaViewer.mouseOver.segment.subscribe(({segment: segmentId, layer }) => {
      this.mouseoverSegmentEmitter.emit({
        layer,
        segmentId,
      })
    })

    // nehubaViewer.navigationState.all emits every time a new layer is added or removed from the viewer
    this._s3$ = this.nehubaViewer.navigationState.all
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
      .filter(() => !this.initNav)
      .subscribe(({ orientation, perspectiveOrientation, perspectiveZoom, position, zoom }) => {

        this.viewerPositionChange.emit({
          orientation : Array.from(orientation),
          perspectiveOrientation : Array.from(perspectiveOrientation),
          perspectiveZoom: perspectiveZoom / PERSPECTIVE_ZOOM_FUDGE_FACTOR,
          zoom,
          position: Array.from(position),
          positionReal : true,
        })
      })

    // this._s4$ = this.nehubaViewer.navigationState.position.inRealSpace
    //   .filter(v => typeof v !== 'undefined' && v !== null)
    //   .subscribe(v => {
    //     this.navPosReal = Array.from(v) as [number, number, number]
    //     this.viewerPosInReal$.next(Array.from(v) as [number, number, number])
    //   })
    this._s5$ = this.nehubaViewer.navigationState.position.inVoxels
      .filter(v => typeof v !== 'undefined' && v !== null)
      .subscribe((v: Float32Array) => {
        this.viewerPosInVoxel$.next(Array.from(v))
      })
    // this._s6$ = this.nehubaViewer.mousePosition.inRealSpace
    //   .filter(v => typeof v !== 'undefined' && v !== null)
    //   .subscribe(v => {
    //     this.mousePosReal = Array.from(v) as [number, number, number]
    //     this.mousePosInReal$.next(Array.from(v))
    //   })
    this._s7$ = this.nehubaViewer.mousePosition.inVoxels
      .filter((v: Float32Array) => typeof v !== 'undefined' && v !== null)
      .subscribe((v: Float32Array) => {
        this.mousePosInVoxel$.next(Array.from(v) as [number, number, number] )
      })
  }

  private loadNewParcellation() {

    this._s$.forEach(_s$ => {
      if (_s$) { _s$.unsubscribe() }
    })
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

    const layersManager = this.nehubaViewer.ngviewer.state.children.get("layers")
    const layerJson = layersManager.toJSON()
    for (const layer of layerJson) {
      if (layer.name in mainDict) {
        layer['segmentColors'] = mainDict[layer.name]
      }
    }
    layersManager.restoreState(layerJson)
    this.#triggerMeshLoad$.next(null)
  }
}

const patchSliceViewPanel = (sliceViewPanel: any) => {
  const originalDraw = sliceViewPanel.draw
  sliceViewPanel.draw = function(this) {

    if (this.sliceView) {
      const viewportToDataEv = new CustomEvent('viewportToData', {
        bubbles: true,
        detail: {
          viewportToData : this.sliceView.viewportToData,
        },
      })
      this.element.dispatchEvent(viewportToDataEv)
    }

    originalDraw.call(this)
  }
}

export interface ViewerState {
  orientation: number[]
  perspectiveOrientation: number[]
  perspectiveZoom: number
  position: number[]
  positionReal: boolean
  zoom: number
}

export const ICOSAHEDRON = `# vtk DataFile Version 2.0
Converted using https://github.com/HumanBrainProject/neuroglancer-scripts
ASCII
DATASET POLYDATA
POINTS 12 float
-525731.0 0.0 850651.0
525731.0 0.0 850651.0
-525731.0 0.0 -850651.0
525731.0 0.0 -850651.0
0.0 850651.0 525731.0
0.0 850651.0 -525731.0
0.0 -850651.0 525731.0
0.0 -850651.0 -525731.0
850651.0 525731.0 0.0
-850651.0 525731.0 0.0
850651.0 -525731.0 0.0
-850651.0 -525731.0 0.0
POLYGONS 20 80
3 1 4 0
3 4 9 0
3 4 5 9
3 8 5 4
3 1 8 4
3 1 10 8
3 10 3 8
3 8 3 5
3 3 2 5
3 3 7 2
3 3 10 7
3 10 6 7
3 6 11 7
3 6 0 11
3 6 1 0
3 10 1 6
3 11 0 9
3 2 11 9
3 5 2 9
3 11 2 7`

declare const TextEncoder

export const _encoder = new TextEncoder()
export const ICOSAHEDRON_VTK_URL = URL.createObjectURL( new Blob([ _encoder.encode(ICOSAHEDRON) ], {type : 'application/octet-stream'} ))

export const FRAGMENT_MAIN_WHITE = `void main(){emitRGB(vec3(1.0,1.0,1.0));}`
export const FRAGMENT_EMIT_WHITE = `emitRGB(vec3(1.0, 1.0, 1.0));`
export const FRAGMENT_EMIT_RED = `emitRGB(vec3(1.0, 0.1, 0.12));`
export const computeDistance = (pt1: [number, number], pt2: [number, number]) => ((pt1[0] - pt2[0]) ** 2 + (pt1[1] - pt2[1]) ** 2) ** 0.5
