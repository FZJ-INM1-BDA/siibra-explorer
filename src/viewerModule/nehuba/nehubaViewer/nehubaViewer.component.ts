import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, Inject, Optional } from "@angular/core";
import { fromEvent, Subscription, ReplaySubject, BehaviorSubject, Observable, race, timer, Subject } from 'rxjs'
import { debounceTime, filter, map, scan, startWith, mapTo, switchMap, take, skip, tap } from "rxjs/operators";
import { AtlasWorkerService } from "src/atlasViewer/atlasViewer.workerService.service";
import { StateInterface as ViewerConfiguration } from "src/services/state/viewerConfig.store";
import { LoggingService } from "src/logging";
import { getExportNehuba, getViewer, setNehubaViewer, switchMapWaitFor } from "src/util/fn";
import { NEHUBA_INSTANCE_INJTKN, scanSliceViewRenderFn } from "../util";
import { deserialiseParcRegionId } from 'common/util'
import { IMeshesToLoad, SET_MESHES_TO_LOAD } from "../constants";
import { IColorMap, SET_COLORMAP_OBS, SET_LAYER_VISIBILITY } from "../layerCtrl.service";

import '!!file-loader?context=third_party&name=main.bundle.js!export-nehuba/dist/min/main.bundle.js'
import '!!file-loader?context=third_party&name=chunk_worker.bundle.js!export-nehuba/dist/min/chunk_worker.bundle.js'

const NG_LANDMARK_LAYER_NAME = 'spatial landmark layer'
const NG_USER_LANDMARK_LAYER_NAME = 'user landmark layer'

/**
 * optimized for nehubaConfig.layout.useNehubaPerspective.fixedZoomPerspectiveSlices
 *  sliceZoom
 *  sliceViewportWidth
 *  sliceViewportHeight
 */
const NG_LANDMARK_CONSTANT = 1e-8

export const IMPORT_NEHUBA_INJECT_TOKEN = `IMPORT_NEHUBA_INJECT_TOKEN`

interface LayerLabelIndex {
  layer: {
    name: string
  }

  labelIndicies: number[]
}

export interface INehubaLifecycleHook{
  onInit?: () => void
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

export class NehubaViewerUnit implements OnInit, OnDestroy {

  private sliceviewLoading$: Observable<boolean>

  public overrideShowLayers: string[] = []

  public lifecycle: INehubaLifecycleHook

  public viewerPosInVoxel$ = new BehaviorSubject(null)
  public viewerPosInReal$ = new BehaviorSubject(null)
  public mousePosInVoxel$ = new BehaviorSubject(null)
  public mousePosInReal$ = new BehaviorSubject(null)

  private exportNehuba: any

  private subscriptions: Subscription[] = []

  @Output() public nehubaReady: EventEmitter<null> = new EventEmitter()
  @Output() public layersChanged: EventEmitter<null> = new EventEmitter()
  private layersChangedHandler: any
  @Output() public viewerPositionChange: EventEmitter<any> = new EventEmitter()
  @Output() public mouseoverSegmentEmitter:
    EventEmitter<{
      segmentId: number | null
      segment: string | null
      layer: {
        name?: string
        url?: string
      }
    }> = new EventEmitter()
  @Output() public mouseoverLandmarkEmitter: EventEmitter<number | null> = new EventEmitter()
  @Output() public mouseoverUserlandmarkEmitter: EventEmitter<string> = new EventEmitter()
  @Output() public regionSelectionEmitter: EventEmitter<{segment: number, layer: {name?: string, url?: string}}> = new EventEmitter()
  @Output() public errorEmitter: EventEmitter<any> = new EventEmitter()

  public auxilaryMeshIndices: number[] = []

  /* only used to set initial navigation state */
  public initNav: any
  public initRegions: any[]
  public initNiftiLayers: any[] = []

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
  public _s4$: any = null
  public _s5$: any = null
  public _s6$: any = null
  public _s7$: any = null
  public _s8$: any = null

  public _s$: any[] = [
    this._s2$,
    this._s3$,
    this._s4$,
    this._s5$,
    this._s6$,
    this._s7$,
    this._s8$,
  ]

  public ondestroySubscriptions: Subscription[] = []

  private createNehubaPromiseRs: Function
  private createNehubaPromise = new Promise(rs => {
    this.createNehubaPromiseRs = rs
  })

  public nehubaLoaded: boolean = false

  public landmarksLoaded: boolean = false

  constructor(
    public elementRef: ElementRef,
    private workerService: AtlasWorkerService,
    private log: LoggingService,
    @Inject(IMPORT_NEHUBA_INJECT_TOKEN) getImportNehubaPr: () => Promise<any>,
    @Optional() @Inject(NEHUBA_INSTANCE_INJTKN) private nehubaViewer$: Subject<NehubaViewerUnit>,
    @Optional() @Inject(SET_MESHES_TO_LOAD) private injSetMeshesToLoad$: Observable<IMeshesToLoad>,
    @Optional() @Inject(SET_COLORMAP_OBS) private setColormap$: Observable<IColorMap>,
    @Optional() @Inject(SET_LAYER_VISIBILITY) private layerVis$: Observable<string[]>,
  ) {

    if (this.nehubaViewer$) {
      this.nehubaViewer$.next(this)
    }

    getImportNehubaPr()
      .then(() => {
        this.nehubaLoaded = true
        this.exportNehuba = getExportNehuba()
        const fixedZoomPerspectiveSlices = this.config && this.config.layout && this.config.layout.useNehubaPerspective && this.config.layout.useNehubaPerspective.fixedZoomPerspectiveSlices
        if (fixedZoomPerspectiveSlices) {
          const { sliceZoom, sliceViewportWidth, sliceViewportHeight } = fixedZoomPerspectiveSlices
          const dim = Math.min(sliceZoom * sliceViewportWidth, sliceZoom * sliceViewportHeight)
          this._dim = [dim, dim, dim]
        }
        this.patchNG()
        this.loadNehuba()

        this.layersChangedHandler = this.nehubaViewer.ngviewer.layerManager.layersChanged.add(() => this.layersChanged.emit(null))
        this.nehubaViewer.ngviewer.registerDisposer(this.layersChangedHandler)
      })
      .then(() => {
        // all mutation to this.nehubaViewer should await createNehubaPromise
        this.createNehubaPromiseRs()
      })
      .catch(e => this.errorEmitter.emit(e))

    /**
     * TODO move to layerCtrl.service
     */
    this.ondestroySubscriptions.push(
      fromEvent(this.workerService.worker, 'message').pipe(
        filter((message: any) => {

          if (!message) {
            // this.log.error('worker response message is undefined', message)
            return false
          }
          if (!message.data) {
            // this.log.error('worker response message.data is undefined', message.data)
            return false
          }
          if (message.data.type !== 'ASSEMBLED_LANDMARKS_VTK') {
            /* worker responded with not assembled landmark, no need to act */
            return false
          }
          if (!message.data.url) {
            /* file url needs to be defined */
            return false
          }
          return true
        }),
        debounceTime(100),
        filter(e => this.templateId === e.data.template),
        map(e => e.data.url),
      ).subscribe(url => {
        this.removeSpatialSearch3DLandmarks()
        const _ = {}
        _[NG_LANDMARK_LAYER_NAME] = {
          type : 'mesh',
          source : `vtk://${url}`,
          shader : FRAGMENT_MAIN_WHITE,
        }
        this.loadLayer(_)
      }),
    )

    /**
     * TODO move to layerCtrl.service
     */
    this.ondestroySubscriptions.push(
      fromEvent(this.workerService.worker, 'message').pipe(
        filter((message: any) => {

          if (!message) {
            // this.log.error('worker response message is undefined', message)
            return false
          }
          if (!message.data) {
            // this.log.error('worker response message.data is undefined', message.data)
            return false
          }
          if (message.data.type !== 'ASSEMBLED_USERLANDMARKS_VTK') {
            /* worker responded with not assembled landmark, no need to act */
            return false
          }
          /**
           * nb url may be undefined
           * if undefined, user have removed all user landmarks, and all that needs to be done
           * is remove the user landmark layer
           *
           * message.data.url
           */

          return true
        }),
        debounceTime(100),
        map(e => e.data.url),
      ).subscribe(url => {
        this.landmarksLoaded = !!url
        this.removeuserLandmarks()

        /**
         * url may be null if user removes all landmarks
         */
        if (!url) {
          /**
           * remove transparency from meshes in current layer(s)
           */
          this.setMeshTransparency(false)
          return
        }
        const _ = {}
        _[NG_USER_LANDMARK_LAYER_NAME] = {
          type: 'mesh',
          source: `vtk://${url}`,
          shader: this.userLandmarkShader,
        }
        this.loadLayer(_)

        /**
         * adding transparency to meshes in current layer(s)
         */
        this.setMeshTransparency(true)
      }),
    )
  
    if (this.setColormap$) {
      this.ondestroySubscriptions.push(
        this.setColormap$.pipe(
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
          switchMap(switchMapWaitFor({ condition: () => !!(this.nehubaViewer?.ngviewer) })),
          tap(() => {
            const managedLayers = this.nehubaViewer.ngviewer.layerManager.managedLayers
            managedLayers.forEach(layer => layer.setVisible(false))
          }),
          debounceTime(160),
        ).subscribe((layerNames: string[]) => {

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
  }

  public numMeshesToBeLoaded: number = 0

  public applyPerformanceConfig({ gpuLimit }: Partial<ViewerConfiguration>) {
    if (gpuLimit && this.nehubaViewer) {
      const limit = this.nehubaViewer.ngviewer.state.children.get('gpuMemoryLimit')
      if (limit && limit.restoreState) {
        limit.restoreState(gpuLimit)
      }
    }
  }

  /* required to check if correct landmarks are loaded */
  private _templateId: string
  get templateId() {
    return this._templateId
  }
  set templateId(id: string) {
    this._templateId = id
  }

  public spatialLandmarkSelectionChanged(labels: number[]) {
    const getCondition = (label: number) => `if(label > ${label - 0.1} && label < ${label + 0.1} ){${FRAGMENT_EMIT_RED}}`
    const newShader = `void main(){ ${labels.map(getCondition).join('else ')}else {${FRAGMENT_EMIT_WHITE}} }`
    if (!this.nehubaViewer) {
      if (!PRODUCTION) { this.log.warn('setting special landmark selection changed failed ... nehubaViewer is not yet defined') }
      return
    }
    const landmarkLayer = this.nehubaViewer.ngviewer.layerManager.getLayerByName(NG_LANDMARK_LAYER_NAME)
    if (!landmarkLayer) {
      if (!PRODUCTION) { this.log.warn('landmark layer could not be found ... will not update colour map') }
      return
    }
    if (labels.length === 0) {
      landmarkLayer.layer.displayState.fragmentMain.restoreState(FRAGMENT_MAIN_WHITE)
    } else {
      landmarkLayer.layer.displayState.fragmentMain.restoreState(newShader)
    }
  }

  // TODO move region management to another service

  public multiNgIdsLabelIndexMap: Map<string, Map<number, any>> = new Map()

  public navPosReal: [number, number, number] = [0, 0, 0]
  public navPosVoxel: [number, number, number] = [0, 0, 0]

  public mousePosReal: [number, number, number] = [0, 0, 0]
  public mousePosVoxel: [number, number, number] = [0, 0, 0]

  public viewerState: ViewerState

  private _multiNgIdColorMap: Map<string, Map<number, {red: number, green: number, blue: number}>>
  get multiNgIdColorMap() {
    return this._multiNgIdColorMap
  }

  set multiNgIdColorMap(val) {
    this._multiNgIdColorMap = val
  }

  private loadMeshes$: ReplaySubject<{labelIndicies: number[], layer: { name: string }}> = new ReplaySubject()
  private loadMeshes(labelIndicies: number[], { name }) {
    this.loadMeshes$.next({
      labelIndicies,
      layer: { name },
    })
  }

  public mouseOverSegment: number | null
  public mouseOverLayer: {name: string, url: string}| null

  public getNgHash: () => string = () => this.exportNehuba
    ? this.exportNehuba.getNgHash()
    : null

  public redraw() {
    this.nehubaViewer.redraw()
  }

  public loadNehuba() {
    this.nehubaViewer = this.exportNehuba.createNehubaViewer(this.config, (err) => {
      /* print in debug mode */
      this.log.error(err)
    })

    /**
     * Hide all layers except the base layer (template)
     * Then show the layers referenced in multiNgIdLabelIndexMap
     */

    this.redraw()

    /* creation of the layout is done on next frame, hence the settimeout */
    setTimeout(() => {
      getViewer().display.panels.forEach(patchSliceViewPanel)
      this.nehubaReady.emit(null)
    })

    this.newViewerInit()
    this.loadNewParcellation()

    setNehubaViewer(this.nehubaViewer)

    this.onDestroyCb.push(() => setNehubaViewer(null))
  }

  public ngOnInit() {
    this.sliceviewLoading$ = fromEvent(this.elementRef.nativeElement, 'sliceRenderEvent').pipe(
      scan(scanSliceViewRenderFn, [ null, null, null ]),
      map(arrOfFlags => arrOfFlags.some(flag => flag)),
      startWith(true),
    )

    this.subscriptions.push(
      (this.injSetMeshesToLoad$ || this.loadMeshes$).pipe(
        scan(scanFn, []),
        debounceTime(100),
        switchMap(layerLabelIdx => 
          /**
           * sometimes (e.g. when all slice views are minimised), sliceviewlaoding will not emit
           * so if sliceviewloading does not emit another value (except the initial true value)
           * force start loading of mesh
           */
          race(
            this.sliceviewLoading$.pipe(
              skip(1)
            ),
            timer(500).pipe(
              mapTo(false)
            )
          ).pipe(
            filter(flag => !flag),
            take(1),
            mapTo(layerLabelIdx),
          ) 
        ),
      ).subscribe(layersLabelIndex => {
        let totalMeshes = 0
        for (const layerLayerIndex of layersLabelIndex) {
          const { layer, labelIndicies } = layerLayerIndex
          totalMeshes += labelIndicies.length
          this.nehubaViewer.setMeshesToLoad(labelIndicies, layer)
        }
        // TODO implement total mesh to be loaded and mesh loading UI
        this.numMeshesToBeLoaded = totalMeshes
      }),
    )

    const { onInit } = this.lifecycle || {}
    onInit && onInit.call(this)
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
      const map = this.multiNgIdsLabelIndexMap.get(this.mouseOverLayer.name)
      const region = map && map.get(this.mouseOverSegment)
      if (arg === 'select') {
        this.regionSelectionEmitter.emit({ segment: region, layer: this.mouseOverLayer })
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

  private userLandmarkShader: string = FRAGMENT_MAIN_WHITE
  
  // TODO single landmark for user landmark
  public updateUserLandmarks(landmarks: any[]) {
    if (!this.nehubaViewer) {
      return
    }
    
    this.workerService.worker.postMessage({
      type : 'GET_USERLANDMARKS_VTK',
      scale: Math.min(...this.dim.map(v => v * NG_LANDMARK_CONSTANT)),
      landmarks : landmarks.map(lm => lm.position.map(coord => coord * 1e6)),
    })

    const parseLmColor = lm => {
      if (!lm) return null
      const { color } = lm
      if (!color) return null
      if (!Array.isArray(color)) return null
      if (color.length !== 3) return null
      const parseNum = num => (num >= 0 && num <= 255 ? num / 255 : 1).toFixed(3)
      return `emitRGB(vec3(${color.map(parseNum).join(',')}));`
    }
  
    const appendConditional = (frag, idx) => frag && `if (label > ${idx - 0.01} && label < ${idx + 0.01}) { ${frag} }`

    if (landmarks.some(parseLmColor)) {
      this.userLandmarkShader = `void main(){ ${landmarks.map(parseLmColor).map(appendConditional).filter(v => !!v).join('else ')} else {${FRAGMENT_EMIT_WHITE}} }`
    } else {
      this.userLandmarkShader = FRAGMENT_MAIN_WHITE  
    }
  }

  public removeSpatialSearch3DLandmarks() {
    this.removeLayer({
      name : NG_LANDMARK_LAYER_NAME,
    })
  }

  public removeuserLandmarks() {
    this.removeLayer({
      name : NG_USER_LANDMARK_LAYER_NAME,
    })
  }

  // pos in mm
  public addSpatialSearch3DLandmarks(geometries: any[], scale?: number, type?: 'icosahedron') {
    this.workerService.worker.postMessage({
      type : 'GET_LANDMARKS_VTK',
      template : this.templateId,
      scale: Math.min(...this.dim.map(v => v * NG_LANDMARK_CONSTANT)),
      landmarks : geometries.map(geometry =>
        geometry === null
          ? null
          // gemoetry : [number,number,number] | [ [number,number,number][], [number,number,number][] ]
          : isNaN(geometry[0])
            ? [geometry[0].map(triplets => triplets.map(coord => coord * 1e6)), geometry[1]]
            : geometry.map(coord => coord * 1e6),
      ),
    })
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

  public hideAllSeg() {
    if (!this.nehubaViewer) { return }
    Array.from(this.multiNgIdsLabelIndexMap.keys()).forEach(ngId => {

      Array.from(this.multiNgIdsLabelIndexMap.get(ngId).keys()).forEach(idx => {
        this.nehubaViewer.hideSegment(idx, {
          name: ngId,
        })
      })
      this.nehubaViewer.showSegment(0, {
        name: ngId,
      })
    })
  }

  public showAllSeg() {
    if (!this.nehubaViewer) { return }
    this.hideAllSeg()
    Array.from(this.multiNgIdsLabelIndexMap.keys()).forEach(ngId => {
      this.nehubaViewer.hideSegment(0, {
        name: ngId,
      })
    })
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
      const { ngId, labelIndex } = deserialiseParcRegionId(curr)
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

  private vec3(pos: [number, number, number]) {
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
    } = newViewerState

    if ( perspectiveZoom ) {
      this.nehubaViewer.ngviewer.perspectiveNavigationState.zoomFactor.restoreState(perspectiveZoom)
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

    if (this.landmarksLoaded) {
      /**
       * showPerspectSliceView -> ! meshTransparency
       */
      this.setMeshTransparency(!newVal)
    }
  }

  public setMeshTransparency(flag: boolean){

    /**
     * remove transparency from meshes in current layer(s)
     */
    for (const layerKey of this.multiNgIdsLabelIndexMap.keys()) {
      const layer = this.nehubaViewer.ngviewer.layerManager.getLayerByName(layerKey)
      if (layer) {
        layer.layer.displayState.objectAlpha.restoreState(flag ? 0.2 : 1.0)
      }
    }
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

    if (this.initRegions && this.initRegions.length > 0) {
      this.hideAllSeg()
      this.showSegs(this.initRegions)
    }

    if (this.initNiftiLayers.length > 0) {
      this.initNiftiLayers.forEach(layer => this.loadLayer(layer))
      this.hideAllSeg()
    }

    this._s8$ = this.nehubaViewer.mouseOver.segment.subscribe(({segment: segmentId, layer }) => {

      const {name = 'unnamed'} = layer
      const map = this.multiNgIdsLabelIndexMap.get(name)
      const region = map && map.get(segmentId)
      this.mouseoverSegmentEmitter.emit({
        layer,
        segment: region,
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
        this.viewerState = {
          orientation,
          perspectiveOrientation,
          perspectiveZoom,
          zoom,
          position,
          positionReal : false,
        }

        this.viewerPositionChange.emit({
          orientation : Array.from(orientation),
          perspectiveOrientation : Array.from(perspectiveOrientation),
          perspectiveZoom,
          zoom,
          position: Array.from(position),
          positionReal : true,
        })
      })

    // TODO bug: mouseoverlandmarkemitter does not emit empty for VTK layer when user mouse click
    this.ondestroySubscriptions.push(
      this.nehubaViewer.mouseOver.layer
        .filter(obj => obj.layer.name === NG_LANDMARK_LAYER_NAME)
        .subscribe(obj => this.mouseoverLandmarkEmitter.emit(obj.value)),
    )

    this.ondestroySubscriptions.push(
      this.nehubaViewer.mouseOver.layer
        .filter(obj => obj.layer.name === NG_USER_LANDMARK_LAYER_NAME)
        .subscribe(obj => this.mouseoverUserlandmarkEmitter.emit(obj.value)),
    )

    this._s4$ = this.nehubaViewer.navigationState.position.inRealSpace
      .filter(v => typeof v !== 'undefined' && v !== null)
      .subscribe(v => {
        this.navPosReal = Array.from(v) as [number, number, number]
        this.viewerPosInReal$.next(Array.from(v))
      })
    this._s5$ = this.nehubaViewer.navigationState.position.inVoxels
      .filter(v => typeof v !== 'undefined' && v !== null)
      .subscribe(v => {
        this.navPosVoxel = Array.from(v) as [number, number, number]
        this.viewerPosInVoxel$.next(Array.from(v))
      })
    this._s6$ = this.nehubaViewer.mousePosition.inRealSpace
      .filter(v => typeof v !== 'undefined' && v !== null)
      .subscribe(v => {
        this.mousePosReal = Array.from(v) as [number, number, number]
        this.mousePosInReal$.next(Array.from(v))
      })
    this._s7$ = this.nehubaViewer.mousePosition.inVoxels
      .filter(v => typeof v !== 'undefined' && v !== null)
      .subscribe(v => {
        this.mousePosVoxel = Array.from(v) as [number, number, number]
        this.mousePosInVoxel$.next(Array.from(v))
      })
  }

  private loadNewParcellation() {

    this._s$.forEach(_s$ => {
      if (_s$) { _s$.unsubscribe() }
    })

  }

  private setColorMap(map: Map<string, Map<number, {red: number, green: number, blue: number}>>) {
    this.multiNgIdColorMap = map
    for (const [ ngId, cMap ] of map.entries()) {
      const nMap = new Map()
      for (const [ key, cm ] of cMap.entries()) {
        nMap.set(Number(key), cm)
      }
      this.nehubaViewer.batchAddAndUpdateSegmentColors(
        nMap,
        { name : ngId })
    }
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
  orientation: [number, number, number, number]
  perspectiveOrientation: [number, number, number, number]
  perspectiveZoom: number
  position: [number, number, number]
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
