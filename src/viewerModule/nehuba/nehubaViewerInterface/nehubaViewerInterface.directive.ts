import { Directive, ViewContainerRef, ComponentRef, OnDestroy, Output, EventEmitter, Optional, ChangeDetectorRef } from "@angular/core";
import { NehubaViewerUnit } from "../nehubaViewer/nehubaViewer.component";
import { Store, select } from "@ngrx/store";
import { Subscription, Observable, combineLatest, forkJoin, EMPTY, of } from "rxjs";
import { distinctUntilChanged, filter, scan, map, switchMap, take } from "rxjs/operators";
import { serializeSegment } from "../util";
import { LoggingService } from "src/logging";
import { arrayOfPrimitiveEqual, switchMapWaitFor } from 'src/util/fn'
import { INavObj } from "../constants"
import { NehubaConfig, defaultNehubaConfig, getNehubaConfig } from "../config.service";
import { atlasAppearance, atlasSelection, userPreference } from "src/state";
import { arrayEqual } from "src/util/array";
import { cvtNavigationObjToNehubaConfig } from "../config.service/util";
import { LayerCtrlEffects } from "../layerCtrl.service/layerCtrl.effects";
import { NavigationBaseSvc } from "../navigation.service/navigation.base.service";
import { translateV3Entities } from "src/atlasComponents/sapi/translateV3";
import { MetaV1Schema } from "src/atlasComponents/sapi/volumeMeta";
import { SXPLR_ANNOTATIONS_KEY } from "src/util/constants";


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

export type TMouseoverEvent = {
  layer: {
    name: string
  }
  segment: any | string
  segmentId: string
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
})
export class NehubaViewerContainerDirective implements OnDestroy{

  @Output('iav-nehuba-viewer-container-mouseover')
  public mouseOverSegments = new EventEmitter<TMouseoverEvent[]>()

  @Output('iav-nehuba-viewer-container-navigation')
  public navigationEmitter = new EventEmitter<INavObj>()

  @Output('iav-nehuba-viewer-container-mouse-pos')
  public mousePosEmitter = new EventEmitter<{ voxel: number[], real: number[] }>()

  @Output()
  public iavNehubaViewerContainerViewerLoading: EventEmitter<boolean> = new EventEmitter()
  
  private cr: ComponentRef<NehubaViewerUnit>
  private navigation: atlasSelection.AtlasSelectionState['navigation']
  constructor(
    private el: ViewContainerRef,
    private store$: Store<any>,
    private navBaseSvc: NavigationBaseSvc,
    private effect: LayerCtrlEffects,
    private cdr: ChangeDetectorRef,
    @Optional() private log: LoggingService,
  ){
    this.cdr.detach()

    this.subscriptions.push(
      this.store$.pipe(
        select(atlasAppearance.selectors.octantRemoval),
        distinctUntilChanged(),
        switchMap(
          switchMapWaitFor({
            condition: () => !!this.nehubaViewerInstance,
            interval: 160,
            leading: true
          })
        )
      ).subscribe(flag =>{
        
        if (!this.nehubaViewerInstance) {
          this.log.error(`this.nehubaViewerInstance is not yet available`)
          return
        }
        this.nehubaViewerInstance.toggleOctantRemoval(flag)
      }),
      this.store$.pipe(
        atlasSelection.fromRootStore.distinctATP(),
        
        distinctUntilChanged((o, n) => {
          return (
            o?.template?.id === n?.template?.id
            && o?.parcellation?.id === n?.parcellation?.id
          )
        }),
        switchMap(({template, parcellation }) => 
          forkJoin([
            
            this.store$.pipe(
              select(atlasAppearance.selectors.customLayers),
              map(cl => cl.filter(l => l.clType === "baselayer/nglayer") as atlasAppearance.const.NgLayerCustomLayer[]),
              filter(layers => layers.length > 0),
              distinctUntilChanged(arrayEqual((oi, ni) => oi?.id === ni?.id)),
              switchMap(layers => {
                
                const templIds = new Set(layers.map(v => v.sxplrAnnotations[SXPLR_ANNOTATIONS_KEY.TEMPLATE_ID]).filter(v => !!v))
                const parcellationIds = new Set(layers.map(v => v.sxplrAnnotations[SXPLR_ANNOTATIONS_KEY.PARCELLATION_ID]).filter(v => !!v))
                if (templIds.size !== 1 || parcellationIds.size !== 1) {
                  return EMPTY
                }
                const templId = Array.from(templIds)[0]
                const parcellationId = Array.from(parcellationIds)[0]
                if (templId !== template?.id || parcellationId !== parcellation?.id) {
                  return EMPTY
                }
                return of(layers)
              }),
              take(1),
            ),
            translateV3Entities.translateSpaceToVolumeImageMeta(template)
          ]).pipe(
            map(([ ngBaseLayers, metas ]) => {
  
              let config: MetaV1Schema["https://schema.brainatlas.eu/github/humanbrainproject/nehuba"]['config']
  
              for (const meta of metas){
                const cfg = meta?.meta?.["https://schema.brainatlas.eu/github/humanbrainproject/nehuba"]?.config
                if (cfg) {
                  config = cfg
                  break
                }
              }
              config ||= getNehubaConfig(template)
              config.dataset.initialNgState.layers = {}
              for (const baseLayer of ngBaseLayers) {
                config.dataset.initialNgState.layers[baseLayer.id] = baseLayer
              }
              return config
            })
          )
        ),
      ).subscribe(async config => {
        const overwritingInitState = this.navigation
          ? cvtNavigationObjToNehubaConfig(this.navigation, config.dataset.initialNgState)
          : {}
    
        config.dataset.initialNgState = {
          ...config.dataset.initialNgState,
          ...overwritingInitState,
        }

        const {
          parcNgLayers,
        } = await this.effect.onATPDebounceNgLayers$.pipe(
          take(1)
        ).toPromise()

        if (this.gpuLimit) {
          config.dataset.initialNgState['gpuMemoryLimit'] = this.gpuLimit  
        }

        await this.createNehubaInstance(config)

        const ngIdSegmentsMap: Record<string, number[]> = {} 
  
        for (const key in parcNgLayers) {
          ngIdSegmentsMap[key] = parcNgLayers[key].labelIndicies
        }
  
        this.nehubaViewerInstance.ngIdSegmentsMap = ngIdSegmentsMap
      }),

      this.store$.pipe(
        select(atlasSelection.selectors.standaloneVolumes),
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
        await this.createNehubaInstance(copiedNehubaConfig)
      }),

      this.gpuLimit$.pipe(
      ).subscribe(limit => {
        this.gpuLimit = limit
        if (this.nehubaViewerInstance && this.nehubaViewerInstance.nehubaViewer) {
          this.nehubaViewerInstance.applyGpuLimit(limit)
        }
      }),
      this.navBaseSvc.nehubaViewerUnit$.pipe(
        switchMap(nvUnit => nvUnit.viewerPositionChange)
      ).subscribe(v => this.navigationEmitter.emit(v)),
      this.store$.pipe(
        select(atlasSelection.selectors.navigation)
      ).subscribe(nav => this.navigation = nav)
    )
  }

  private gpuLimit$: Observable<number> = this.store$.pipe(
    select(userPreference.selectors.gpuLimit)
  )
  private gpuLimit: number = null

  private nehubaViewerSubscriptions: Subscription[] = []
  private subscriptions: Subscription[] = []

  redraw(): void{
    this.nehubaViewerInstance.redraw()
  }

  ngOnDestroy(): void{
    while(this.subscriptions.length > 0){
      this.subscriptions.pop().unsubscribe()
    }
    while (this.nehubaViewerSubscriptions.length > 0) {
      this.nehubaViewerSubscriptions.pop().unsubscribe()
    }
  }


  async createNehubaInstance(nehubaConfig: NehubaConfig): Promise<void>{
    this.clear()

    await new Promise(rs => setTimeout(rs, 0))

    this.iavNehubaViewerContainerViewerLoading.emit(true)
    this.cr = this.el.createComponent(NehubaViewerUnit)


    if (this.gpuLimit) {
      const initialNgState = nehubaConfig && nehubaConfig.dataset && nehubaConfig.dataset.initialNgState
      // the correct key is gpuMemoryLimit
      initialNgState.gpuMemoryLimit = this.gpuLimit
    }

    /**
     * apply viewer config such as gpu limit
     */

    this.nehubaViewerInstance.config = nehubaConfig
    this.nehubaViewerSubscriptions.push(

      this.nehubaViewerInstance.mouseoverSegmentEmitter.pipe(
        scan(accumulatorFn, new Map()),
        map((map: Map<string, any>) => Array.from(map.entries()).filter(([_ngId, { segmentId }]) => segmentId)),
      ).subscribe(val => this.handleMouseoverSegments(val)),


      combineLatest([
        this.nehubaViewerInstance.mousePosInVoxel$,
        this.nehubaViewerInstance.mousePosInReal$
      ]).subscribe(([ voxel, real ]) => {
        this.mousePosEmitter.emit({
          voxel,
          real
        })
      })
    )
  }

  clear(): void{
    while(this.nehubaViewerSubscriptions.length > 0) {
      this.nehubaViewerSubscriptions.pop().unsubscribe()
    }

    this.iavNehubaViewerContainerViewerLoading.emit(false)
    if(this.cr) this.cr.destroy()
    this.el.clear()
    this.cr = null
  }

  get nehubaViewerInstance(): NehubaViewerUnit{
    return this.cr && this.cr.instance
  }

  isReady(): boolean {
    return !!(this.cr?.instance?.nehubaViewer?.ngviewer)
  }

  handleMouseoverSegments(arrOfArr: [string, any][]): void {
    const payload = arrOfArr.map( ([ngId, {segment, segmentId}]) => {
      return {
        layer: {
          name: ngId,
        },
        segment: segment || serializeSegment(ngId, segmentId),
        segmentId
      }
    })
    this.mouseOverSegments.emit(payload)
  }
}
