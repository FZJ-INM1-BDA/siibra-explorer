import { Directive, ViewContainerRef, ComponentFactoryResolver, ComponentFactory, ComponentRef, OnInit, OnDestroy, Output, EventEmitter } from "@angular/core";
import { NehubaViewerUnit, INehubaLifecycleHook } from "../nehubaViewer/nehubaViewer.component";
import { Store, select } from "@ngrx/store";
import { IavRootStoreInterface } from "src/services/stateStore.service";
import { Subscription, Observable } from "rxjs";
import { distinctUntilChanged, filter, debounceTime, shareReplay, scan, map, throttleTime } from "rxjs/operators";
import { StateInterface as ViewerConfigStateInterface } from "src/services/state/viewerConfig.store";
import { getNavigationStateFromConfig } from "../util";
import { NEHUBA_LAYER_CHANGED, CHANGE_NAVIGATION, VIEWERSTATE_ACTION_TYPES } from "src/services/state/viewerState.store";
import { NEHUBA_READY } from "src/services/state/ngViewerState.store";
import { timedValues } from "src/util/generator";
import { MOUSE_OVER_SEGMENTS, MOUSE_OVER_LANDMARK } from "src/services/state/uiState.store";

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
      // "navigation": {
      //   "pose": {
      //     "position": {
      //       "voxelSize": [
      //         21166.666015625,
      //         20000,
      //         21166.666015625
      //       ],
      //       "voxelCoordinates": [
      //         -21.8844051361084,
      //         16.288618087768555,
      //         28.418994903564453
      //       ]
      //     }
      //   },
      //   "zoomFactor": 350000
      // },
      // "perspectiveOrientation": [
      //   0.3140767216682434,
      //   -0.7418519854545593,
      //   0.4988985061645508,
      //   -0.3195493221282959
      // ],
      // "perspectiveZoom": 1922235.5293810747
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
      // "removePerspectiveSlicesBackground": {
      //   "color": [
      //     1,
      //     1,
      //     1,
      //     1
      //   ],
      //   "mode": "=="
      // },
      "perspectiveBackground": [
        1,
        1,
        1,
        1
      ],
      // "fixedZoomPerspectiveSlices": {
      //   "sliceViewportWidth": 300,
      //   "sliceViewportHeight": 300,
      //   "sliceZoom": 563818.3562426177,
      //   "sliceViewportSizeMultiplier": 2
      // },
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
      // "centerToOrigin": true,
      // "drawSubstrates": {
      //   "color": [
      //     0,
      //     0,
      //     0.5,
      //     0.15
      //   ]
      // },
      // "drawZoomLevels": {
      //   "cutOff": 200000,
      //   "color": [
      //     0.5,
      //     0,
      //     0,
      //     0.15
      //   ]
      // },
      "hideImages": false,
      "waitForMesh": false,
      // "restrictZoomLevel": {
      //   "minZoom": 1200000,
      //   "maxZoom": 3500000
      // }
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
  exportAs: 'iavNehubaViewerContainer'
})

export class NehubaViewerContainerDirective implements OnInit, OnDestroy{

  @Output()
  public iavNehubaViewerContainerViewerLoading: EventEmitter<boolean> = new EventEmitter()
  
  private nehubaViewerFactory: ComponentFactory<NehubaViewerUnit>
  private cr: ComponentRef<NehubaViewerUnit>
  constructor(
    private el: ViewContainerRef,
    private cfr: ComponentFactoryResolver,
    private store$: Store<IavRootStoreInterface>,
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

    const viewerState$ = this.store$.pipe(
      select('viewerState'),
      shareReplay(1)
    )

    this.navigationChanges$ = viewerState$.pipe(
      select('navigation'),
      filter(v => !!v)
    )
  }

  private navigationChanges$: Observable<any>

  private viewerPerformanceConfig$: Observable<ViewerConfigStateInterface>
  private viewerConfig: Partial<ViewerConfigStateInterface> = {}

  public oldNavigation: any = {}
  private storedNav: any

  private nehubaViewerSubscriptions: Subscription[] = []
  private subscriptions: Subscription[] = []

  ngOnInit(){
    this.subscriptions.push(
      this.store$.pipe(
        select('viewerState'),
        select('standaloneVolumes'),
        filter(v => v && Array.isArray(v) && v.length > 0),
        distinctUntilChanged()
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


      this.navigationChanges$.subscribe(ev => {
        if (this.nehubaViewerInstance) {
          this.handleDispatchedNavigationChange(ev)
        } else {
          this.storedNav = {
            ...ev,
            positionReal: true
          }
        }
      }),
    )
  }

  ngOnDestroy(){
    while(this.subscriptions.length > 0){
      this.subscriptions.pop().unsubscribe()
    }
  }

  createNehubaInstance(template: any, lifeCycle: INehubaLifecycleHook = {}){
    this.clear()
    this.iavNehubaViewerContainerViewerLoading.emit(true)
    this.cr = this.el.createComponent(this.nehubaViewerFactory)

    if (this.storedNav) {
      this.nehubaViewerInstance.initNav = this.storedNav
      this.storedNav = null
    }

    const { nehubaConfig } = template

    /**
     * apply viewer config such as gpu limit
     */
    const { gpuLimit = null } = this.viewerConfig

    this.nehubaViewerInstance.config = nehubaConfig
    this.nehubaViewerInstance.lifecycle = lifeCycle

    this.oldNavigation = getNavigationStateFromConfig(nehubaConfig)
    this.handleEmittedNavigationChange(this.oldNavigation)

    if (gpuLimit) {
      const initialNgState = nehubaConfig && nehubaConfig.dataset && nehubaConfig.dataset.initialNgState
      initialNgState.gpuLimit = gpuLimit
    }

    /* TODO replace with id from KG */
    this.nehubaViewerInstance.templateId = name

    this.nehubaViewerSubscriptions.push(
      this.nehubaViewerInstance.errorEmitter.subscribe(e => {
        console.log(e)
      }),

      this.nehubaViewerInstance.debouncedViewerPositionChange.subscribe(val => {
        this.handleEmittedNavigationChange(val)
      }),

      this.nehubaViewerInstance.layersChanged.subscribe(() => {
        this.store$.dispatch({
          type: NEHUBA_LAYER_CHANGED
        })
      }),

      this.nehubaViewerInstance.nehubaReady.subscribe(() => {
        /**
         * TODO when user selects new template, window.viewer
         */
        this.store$.dispatch({
          type: NEHUBA_READY,
          nehubaReady: true,
        })
      }),

      this.nehubaViewerInstance.mouseoverSegmentEmitter.pipe(
        scan(accumulatorFn, new Map()),
        map(map => Array.from(map.entries()).filter(([_ngId, { segmentId }]) => segmentId)),
      ).subscribe(arrOfArr => {
        this.store$.dispatch({
          type: MOUSE_OVER_SEGMENTS,
          segments: arrOfArr.map( ([ngId, {segment, segmentId}]) => {
            return {
              layer: {
                name: ngId,
              },
              segment: segment || `${ngId}#${segmentId}`,
            }
          } ),
        })
      }),

      this.nehubaViewerInstance.mouseoverLandmarkEmitter.pipe(
        distinctUntilChanged()
      ).subscribe(label => {
        this.store$.dispatch({
          type : MOUSE_OVER_LANDMARK,
          landmark : label,
        })
      }),

      this.nehubaViewerInstance.mouseoverUserlandmarkEmitter.pipe(
        throttleTime(160),
      ).subscribe(label => {
        this.store$.dispatch({
          type: VIEWERSTATE_ACTION_TYPES.MOUSEOVER_USER_LANDMARK_LABEL,
          payload: {
            label,
          },
        })
      }),
    )
  }

  clear(){
    while(this.nehubaViewerSubscriptions.length > 0) {
      this.nehubaViewerSubscriptions.pop().unsubscribe()
    }
    this.iavNehubaViewerContainerViewerLoading.emit(false)
    if(this.cr) this.cr.destroy()
    this.el.clear()
    this.cr = null
  }

  get nehubaViewerInstance(){
    return this.cr && this.cr.instance
  }

  /* because the navigation can be changed from two sources,
    either dynamically (e.g. navigation panel in the UI or plugins etc)
    or actively (via user interaction with the viewer)
    or lastly, set on init

  This handler function is meant to handle anytime viewer's navigation changes from either sources */
  public handleEmittedNavigationChange(navigation) {

    /* If the navigation is changed dynamically, this.oldnavigation is set prior to the propagation of the navigation state to the viewer.
      As the viewer updates the dynamically changed navigation, it will emit the navigation state.
      The emitted navigation state should be identical to this.oldnavigation */

    const navigationChangedActively: boolean = Object.keys(this.oldNavigation).length === 0 || !Object.keys(this.oldNavigation).every(key => {
      return this.oldNavigation[key].constructor === Number || this.oldNavigation[key].constructor === Boolean ?
        this.oldNavigation[key] === navigation[key] :
        this.oldNavigation[key].every((_, idx) => this.oldNavigation[key][idx] === navigation[key][idx])
    })

    /* if navigation is changed dynamically (ie not actively), the state would have been propagated to the store already. Hence return */
    if ( !navigationChangedActively ) { return }

    /* navigation changed actively (by user interaction with the viewer)
      probagate the changes to the store */

    this.store$.dispatch({
      type : CHANGE_NAVIGATION,
      navigation,
    })
  }


  public handleDispatchedNavigationChange(navigation) {

    /* extract the animation object */
    const { animation, ..._navigation } = navigation

    /**
     * remove keys that are falsy
     */
    Object.keys(_navigation).forEach(key => (!_navigation[key]) && delete _navigation[key])

    const { animation: globalAnimationFlag } = this.viewerConfig
    if ( globalAnimationFlag && animation ) {
      /* animated */

      const gen = timedValues()
      const dest = Object.assign({}, _navigation)
      /* this.oldNavigation is old */
      const delta = Object.assign({}, ...Object.keys(dest).filter(key => key !== 'positionReal').map(key => {
        const returnObj = {}
        returnObj[key] = typeof dest[key] === 'number' ?
          dest[key] - this.oldNavigation[key] :
          typeof dest[key] === 'object' ?
            dest[key].map((val, idx) => val - this.oldNavigation[key][idx]) :
            true
        return returnObj
      }))

      const animate = () => {
        const next = gen.next()
        const d =  next.value

        this.nehubaViewerInstance.setNavigationState(
          Object.assign({}, ...Object.keys(dest).filter(k => k !== 'positionReal').map(key => {
            const returnObj = {}
            returnObj[key] = typeof dest[key] === 'number' ?
              dest[key] - ( delta[key] * ( 1 - d ) ) :
              dest[key].map((val, idx) => val - ( delta[key][idx] * ( 1 - d ) ) )
            return returnObj
          }), {
            positionReal : true,
          }),
        )

        if ( !next.done ) {
          requestAnimationFrame(() => animate())
        } else {

          /* set this.oldnavigation to represent the state of the store */
          /* animation done, set this.oldNavigation */
          this.oldNavigation = Object.assign({}, this.oldNavigation, dest)
        }
      }
      requestAnimationFrame(() => animate())
    } else {
      /* not animated */

      /* set this.oldnavigation to represent the state of the store */
      /* since the emitted change of navigation state is debounced, we can safely set this.oldNavigation to the destination */
      this.oldNavigation = Object.assign({}, this.oldNavigation, _navigation)

      this.nehubaViewerInstance.setNavigationState(Object.assign({}, _navigation, {
        positionReal : true,
      }))
    }
  }
}
