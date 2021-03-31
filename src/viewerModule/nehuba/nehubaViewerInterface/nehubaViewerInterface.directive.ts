import { Directive, ViewContainerRef, ComponentFactoryResolver, ComponentFactory, ComponentRef, OnInit, OnDestroy, Output, EventEmitter, Optional } from "@angular/core";
import { NehubaViewerUnit, INehubaLifecycleHook } from "../nehubaViewer/nehubaViewer.component";
import { Store, select } from "@ngrx/store";
import { Subscription, Observable, fromEvent, asyncScheduler } from "rxjs";
import { distinctUntilChanged, filter, debounceTime, scan, map, throttleTime, switchMapTo } from "rxjs/operators";
import { takeOnePipe } from "../util";
import { ngViewerActionNehubaReady } from "src/services/state/ngViewerState/actions";
import { viewerStateMouseOverCustomLandmarkInPerspectiveView, viewerStateNehubaLayerchanged } from "src/services/state/viewerState/actions";
import { viewerStateStandAloneVolumes } from "src/services/state/viewerState/selectors";
import { ngViewerSelectorOctantRemoval } from "src/services/state/ngViewerState/selectors";
import { LoggingService } from "src/logging";
import { uiActionMouseoverLandmark, uiActionMouseoverSegments } from "src/services/state/uiState/actions";
import { IViewerConfigState } from "src/services/state/viewerConfig.store.helper";
import { arrayOfPrimitiveEqual } from 'src/util/fn'
import { NehubaNavigationService } from "../navigation.service";

const defaultNehubaConfig = {
  "configName": "",
  "globals": {
    "hideNullImageValues": true,
    "useNehubaLayout": {
      "keepDefaultLayouts": false
    },
    "useNehubaMeshLayer": true,
    "rightClickWithCtrlGlobal": false,
    "zoomWithoutCtrlGlobal": false,
    "useCustomSegmentColors": true
  },
  "zoomWithoutCtrl": true,
  "hideNeuroglancerUI": true,
  "rightClickWithCtrl": true,
  "rotateAtViewCentre": true,
  "enableMeshLoadingControl": true,
  "zoomAtViewCentre": true,
  "restrictUserNavigation": true,
  "disableSegmentSelection": false,
  "dataset": {
    "imageBackground": [
      1,
      1,
      1,
      1
    ],
    "initialNgState": {
      "showDefaultAnnotations": false,
      "layers": {},
    }
  },
  "layout": {
    "views": "hbp-neuro",
    "planarSlicesBackground": [
      1,
      1,
      1,
      1
    ],
    "useNehubaPerspective": {
      "enableShiftDrag": false,
      "doNotRestrictUserNavigation": false,
      "perspectiveSlicesBackground": [
        1,
        1,
        1,
        1
      ],
      "perspectiveBackground": [
        1,
        1,
        1,
        1
      ],
      "mesh": {
        "backFaceColor": [
          1,
          1,
          1,
          1
        ],
        "removeBasedOnNavigation": true,
        "flipRemovedOctant": true
      },
      "hideImages": false,
      "waitForMesh": false,
    }
  }
}

const determineProtocol = (url: string) => {
  const re = /^([a-z0-9_-]{0,}):\/\//.exec(url)
  return re && re[1]
}

const getPrecomputedUrl = url => url.replace(/^precomputed:\/\//, '')

const getPrecomputedInfo = async url => {
  const rootUrl = getPrecomputedUrl(url)
  return new Promise((rs, rj) => {
    fetch(`${rootUrl.replace(/\/$/,'')}/info`)
      .then(res => res.json())
      .then(rs)
      .catch(rj)
  })
}

interface IProcessedVolume{
  name?: string
  layer: {
    type?: 'image' | 'segmentation'
    source: string
    transform?: any
  }
}

const processStandaloneVolume: (url: string) => Promise<IProcessedVolume> = async (url: string) => {
  const protocol = determineProtocol(url)
  if (protocol === 'nifti'){
    return {
      layer: {
        type: 'image',
        source: url,
        visible: true
      }
    }
  }
  if (protocol === 'precomputed'){
    let layerType
    try {
      const { type } = await getPrecomputedInfo(url) as any
      layerType = type
    } catch (e) {
      console.warn(`getPrecomputedInfo error:`, e)
    }
    
    return {
      layer: {
        type: layerType || 'image', 
        source: url,
        visible: true
      }
    }
  }
  throw new Error(`type cannot be determined: ${url}`)
}


const accumulatorFn: (
  acc: Map<string, { segment: string | null, segmentId: number | null }>,
  arg: {layer: {name: string}, segmentId: number|null, segment: string | null},
) => Map<string, {segment: string | null, segmentId: number|null}>
= (acc, arg) => {
  const { layer, segment, segmentId } = arg
  const { name } = layer
  const newMap = new Map(acc)
  newMap.set(name, {segment, segmentId})
  return newMap
}

// methods
//
// new viewer
// change state (layer visibliity)
// change state (segment visibility)
// change state (color map)
// change state (add/remove layer)
// changeNavigation
// setLayout (2x2 or max screen)

// emitters
//
// mouseoverSegments
// mouseoverLandmarks
// selectSegment
// navigationChanged

/**
 * This directive should only deal with non-navigational interface between
 * - viewer (nehuba)
 * - state store (ngrx)
 * 
 * 
 * public prop
 * 
 * - newViewer (new template / null for destroying current instance)
 * - segmentVisibility change
 * - setColorMap for segmentation map
 * - add/remove layer (image/segmentation/mesh)
 * 
 * emitters
 * 
 * - mouseoverSegments
 * - mouseoverLandmark
 * - selectSegment
 * - loadingStatus
 */

@Directive({
  selector: '[iav-nehuba-viewer-container]',
  exportAs: 'iavNehubaViewerContainer',
  providers: [ NehubaNavigationService ]
})
export class NehubaViewerContainerDirective implements OnInit, OnDestroy{

  public viewportToDatas: [any, any, any] = [null, null, null]

  @Output()
  public iavNehubaViewerContainerViewerLoading: EventEmitter<boolean> = new EventEmitter()
  
  private nehubaViewerFactory: ComponentFactory<NehubaViewerUnit>
  private cr: ComponentRef<NehubaViewerUnit>
  constructor(
    private el: ViewContainerRef,
    private cfr: ComponentFactoryResolver,
    private store$: Store<any>,
    private navService: NehubaNavigationService,
    @Optional() private log: LoggingService,
  ){
    this.nehubaViewerFactory = this.cfr.resolveComponentFactory(NehubaViewerUnit)

    this.viewerPerformanceConfig$ = this.store$.pipe(
      select('viewerConfigState'),
      /**
       * TODO: this is only a bandaid fix. Technically, we should also implement
       * logic to take the previously set config to apply oninit
       */
      distinctUntilChanged(),
    )

    this.nehubaViewerPerspectiveOctantRemoval$ = this.store$.pipe(
      select(ngViewerSelectorOctantRemoval),
    )
  }

  private nehubaViewerPerspectiveOctantRemoval$: Observable<boolean>

  private viewerPerformanceConfig$: Observable<IViewerConfigState>
  private viewerConfig: Partial<IViewerConfigState> = {}

  private nehubaViewerSubscriptions: Subscription[] = []
  private subscriptions: Subscription[] = []

  ngOnInit(){
    this.subscriptions.push(
      this.nehubaViewerPerspectiveOctantRemoval$.pipe(
        distinctUntilChanged()
      ).subscribe(flag =>{
        this.toggleOctantRemoval(flag)
      })
    )

    this.subscriptions.push(
      this.store$.pipe(
        select(viewerStateStandAloneVolumes),
        filter(v => v && Array.isArray(v) && v.length > 0),
        distinctUntilChanged(arrayOfPrimitiveEqual)
      ).subscribe(async volumes => {
        const copiedNehubaConfig = JSON.parse(JSON.stringify(defaultNehubaConfig))

        const forceShowLayerNames = []
        for (const idx in volumes){
          try {
            const { name = `layer-${idx}`, layer } = await processStandaloneVolume(volumes[idx])
            copiedNehubaConfig.dataset.initialNgState.layers[name] = layer
            forceShowLayerNames.push(name)
          }catch(e) {
            // TODO catch error
          }
        }
        function onInit() {
          this.overrideShowLayers = forceShowLayerNames
        }
        this.createNehubaInstance({ nehubaConfig: copiedNehubaConfig }, { onInit })
      }),

      this.viewerPerformanceConfig$.pipe(
        debounceTime(200)
      ).subscribe(config => {
        this.viewerConfig = config
        if (this.nehubaViewerInstance && this.nehubaViewerInstance.nehubaViewer) {
          this.nehubaViewerInstance.applyPerformanceConfig(config)
        }
      }),

    )
  }

  ngOnDestroy(){
    while(this.subscriptions.length > 0){
      this.subscriptions.pop().unsubscribe()
    }
  }

  public toggleOctantRemoval(flag: boolean){
    if (!this.nehubaViewerInstance) {
      this.log.error(`this.nehubaViewerInstance is not yet available`)
      return
    }
    this.nehubaViewerInstance.toggleOctantRemoval(flag)
  }

  createNehubaInstance(template: any, lifeCycle: INehubaLifecycleHook = {}){
    this.clear()
    this.iavNehubaViewerContainerViewerLoading.emit(true)
    this.cr = this.el.createComponent(this.nehubaViewerFactory)

    if (this.navService.storeNav) {
      this.nehubaViewerInstance.initNav = {
        ...this.navService.storeNav,
        positionReal: true
      }
    }

    const { nehubaConfig, name } = template

    /**
     * apply viewer config such as gpu limit
     */
    const { gpuLimit = null } = this.viewerConfig

    this.nehubaViewerInstance.config = nehubaConfig
    this.nehubaViewerInstance.lifecycle = lifeCycle

    if (gpuLimit) {
      const initialNgState = nehubaConfig && nehubaConfig.dataset && nehubaConfig.dataset.initialNgState
      // the correct key is gpuMemoryLimit
      initialNgState.gpuMemoryLimit = gpuLimit
    }

    /* TODO replace with id from KG */
    this.nehubaViewerInstance.templateId = name

    this.nehubaViewerSubscriptions.push(
      this.nehubaViewerInstance.errorEmitter.subscribe(e => {
        console.log(e)
      }),

      this.nehubaViewerInstance.layersChanged.subscribe(() => {
        this.store$.dispatch(
          viewerStateNehubaLayerchanged()
        )
      }),

      this.nehubaViewerInstance.nehubaReady.subscribe(() => {
        /**
         * TODO when user selects new template, window.viewer
         */
        this.store$.dispatch(
          ngViewerActionNehubaReady({
            nehubaReady: true,
          })
        )
      }),

      this.nehubaViewerInstance.mouseoverSegmentEmitter.pipe(
        scan(accumulatorFn, new Map()),
        map((map: Map<string, any>) => Array.from(map.entries()).filter(([_ngId, { segmentId }]) => segmentId)),
      ).subscribe(arrOfArr => {
        this.store$.dispatch(
          uiActionMouseoverSegments({
            segments: arrOfArr.map( ([ngId, {segment, segmentId}]) => {
              return {
                layer: {
                  name: ngId,
                },
                segment: segment || `${ngId}#${segmentId}`,
              }
            } )
          })
        )
      }),

      this.nehubaViewerInstance.mouseoverLandmarkEmitter.pipe(
        distinctUntilChanged()
      ).subscribe(label => {
        this.store$.dispatch(
          uiActionMouseoverLandmark({
            landmark: label
          })
        )
      }),

      this.nehubaViewerInstance.mouseoverUserlandmarkEmitter.pipe(
        throttleTime(160, asyncScheduler, {trailing: true}),
      ).subscribe(label => {
        this.store$.dispatch(
          viewerStateMouseOverCustomLandmarkInPerspectiveView({
            payload: { label }
          })
        )
      }),

      this.nehubaViewerInstance.nehubaReady.pipe(
        switchMapTo(fromEvent(this.nehubaViewerInstance.elementRef.nativeElement, 'viewportToData')),
        takeOnePipe()
      ).subscribe((events: CustomEvent[]) => {
        [0, 1, 2].forEach(idx => this.viewportToDatas[idx] = events[idx].detail.viewportToData)
      }),
    )
  }

  clear(){
    while(this.nehubaViewerSubscriptions.length > 0) {
      this.nehubaViewerSubscriptions.pop().unsubscribe()
    }

    this.store$.dispatch(
      ngViewerActionNehubaReady({
        nehubaReady: false,
      })
    )

    this.iavNehubaViewerContainerViewerLoading.emit(false)
    if(this.cr) this.cr.destroy()
    this.el.clear()
    this.cr = null
  }

  get nehubaViewerInstance(){
    return this.cr && this.cr.instance
  }

  isReady() {
    return !!(this.cr?.instance?.nehubaViewer?.ngviewer)
  }
}
