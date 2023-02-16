import { Component, Output, EventEmitter, ElementRef, OnDestroy, AfterViewInit, Inject, Optional, ChangeDetectionStrategy } from "@angular/core";
import { EnumViewerEvt, IViewer, TViewerEvent } from "src/viewerModule/viewer.interface";
import { combineLatest, forkJoin, from, merge, Observable, Subject } from "rxjs";
import { debounceTime, distinctUntilChanged, filter, map, scan, shareReplay, switchMap } from "rxjs/operators";
import { ComponentStore } from "src/viewerModule/componentStore";
import { select, Store } from "@ngrx/store";
import { ClickInterceptor, CLICK_INTERCEPTOR_INJECTOR } from "src/util";
import { MatSnackBar } from "@angular/material/snack-bar";
import { CONST } from 'common/constants'
import { getUuid } from "src/util/fn";
import { AUTO_ROTATE, TInteralStatePayload, ViewerInternalStateSvc } from "src/viewerModule/viewerInternalState.service";
import { atlasAppearance, atlasSelection } from "src/state";
import { ThreeSurferCustomLabelLayer, ThreeSurferCustomLayer, ColorMapCustomLayer } from "src/state/atlasAppearance/const";
import { SxplrRegion } from "src/atlasComponents/sapi/sxplrTypes"
import { arrayEqual } from "src/util/array";
import { ThreeSurferEffects } from "../store/effects";
import { selectors, actions  } from "../store"
import { SAPI } from "src/atlasComponents/sapi";

const viewerType = 'ThreeSurfer'
type TInternalState = {
  camera: {
    x: number
    y: number
    z: number
  }
  mode: string
  hemisphere: 'left' | 'right' | 'both'
}
const pZoomFactor = 5e3

type THandlingCustomEv = {
  regions: SxplrRegion[]
  error?: string
  evMesh?: {
    faceIndex: number
    verticesIndicies: number[]
  }
}

type TCameraOrientation = {
  perspectiveOrientation: number[]
  perspectiveZoom: number
}

type TThreeGeometry = {
  visible: boolean
}
type GiiInstance = unknown
type TThreeSurfer = {
  loadMesh: (url: string) => Promise<TThreeGeometry>
  unloadMesh: (geom: TThreeGeometry) => void
  redraw: (geom: TThreeGeometry) => void
  applyColorMap: (geom: TThreeGeometry, idxMap?: number[], custom?: { usePreset?: any, custom?: Map<number, number[]> }) => void
  loadColormap: (url: string) => Promise<GiiInstance>
  setupAnimation: () => void
  dispose: () => void
  control: any
  camera: any
  customColormap: WeakMap<TThreeGeometry, any>
}

type LateralityRecord<T> = Record<string, T>

const threshold = 1e-3

function cameraNavsAreSimilar(c1: TCameraOrientation, c2: TCameraOrientation){
  if (c1 === c2) return true
  if (!!c1 && !!c2) return true

  if (!c1 && !!c2) return false
  if (!c2 && !!c1) return false

  if (Math.abs(c1.perspectiveZoom - c2.perspectiveZoom) > threshold) return false
  if ([0, 1, 2, 3].some(
    idx => Math.abs(c1.perspectiveOrientation[idx] - c2.perspectiveOrientation[idx]) > threshold
  )) {
    return false
  }
  return true
}

@Component({
  selector: 'three-surfer-glue-cmp',
  templateUrl: './threeSurfer.template.html',
  styleUrls: [
    './threeSurfer.style.css'
  ],
  providers: [ ComponentStore ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ThreeSurferGlueCmp implements IViewer<'threeSurfer'>, AfterViewInit, OnDestroy {

  
  @Output()
  viewerEvent = new EventEmitter<TViewerEvent<'threeSurfer'>>()

  private domEl: HTMLElement
  private mainStoreCameraNav: TCameraOrientation = null
  private localCameraNav: TCameraOrientation = null

  public lateralityMeshRecord: LateralityRecord<{
    visible: boolean
    meshLayer: ThreeSurferCustomLayer
    mesh: TThreeGeometry
  }> = {}

  public latLblIdxRecord: LateralityRecord<{
    indexLayer: ThreeSurferCustomLabelLayer
    labelIndices: number[]
  }> = {}
  private internalStateNext: (arg: TInteralStatePayload<TInternalState>) => void

  private mouseoverRegions: SxplrRegion[] = []
  
  private selectedRegions$ = this.store$.pipe(
    select(atlasSelection.selectors.selectedRegions)
  )

  private customLayers$ = this.store$.pipe(
    select(atlasAppearance.selectors.customLayers),
    distinctUntilChanged(arrayEqual((o, n) => o.id === n.id)),
    shareReplay(1)
  )
  public meshLayers$: Observable<ThreeSurferCustomLayer[]> = this.customLayers$.pipe(
    map(layers => layers.filter(l => l.clType === "baselayer/threesurfer") as ThreeSurferCustomLayer[]),
    distinctUntilChanged(arrayEqual((o, n) => o.id === n.id)),
  )

  private vertexIndexLayers$: Observable<ThreeSurferCustomLabelLayer[]> = this.customLayers$.pipe(
    map(layers => layers.filter(l => l.clType === "baselayer/threesurfer-label") as ThreeSurferCustomLabelLayer[]),
    distinctUntilChanged(arrayEqual((o, n) => o.id === n.id)),
  )

  /**
   * maps laterality to label index to sapi region
   */
  private latLblIdxToRegionRecord: LateralityRecord<Record<number, SxplrRegion>> = {}
  private latLblIdxToRegionRecord$: Observable<LateralityRecord<Record<number, SxplrRegion>>> = combineLatest([
    this.store$.pipe(
      atlasSelection.fromRootStore.distinctATP()
    ),
    this.store$.pipe(
      select(atlasSelection.selectors.selectedParcAllRegions),
    )
  ]).pipe(
    switchMap(([ { atlas, parcellation, template },  regions]) => {
      const returnObj = {
        'left': {} as Record<number, SxplrRegion>,
        'right': {} as Record<number, SxplrRegion>
      }
      return merge(
        ...regions.map(region => 
          from(this.sapi.getRegionLabelIndices(template, parcellation, region)).pipe(
            map(label => ({ region, label }))
          )
        )
      ).pipe(
        scan((acc, curr) => {
          const { label, region } = curr
          
          let key : 'left' | 'right'
          if ( /left/i.test(region.name) ) key = 'left'
          if ( /right/i.test(region.name) ) key = 'right'
          if (!key) {
            /**
             * TODO
             * there are ... more regions than expected, which has label index without laterality
             */
            return { ...acc }
          }
          return {
            ...acc,
            [key]: {
              ...acc[key],
              [label]: region
            }
          }
        }, {'left': {}, 'right': {}})
      )
    })
  )

  /**
   * colormap in use (both base & custom)
   */

  private colormapInUse: ColorMapCustomLayer
  private colormaps$: Observable<ColorMapCustomLayer[]> = this.customLayers$.pipe(
    map(layers => layers.filter(l => l.clType === "baselayer/colormap" || l.clType === "customlayer/colormap") as ColorMapCustomLayer[]),
  )

  /**
   * show delination map
   */
  private showDelineation: boolean = true

  public threeSurferSurfaceVariants$ = this.effect.onATPDebounceThreeSurferLayers$.pipe(
    map(({ surfaces }) => surfaces.reduce((acc, val) => acc.includes(val.variant) ? acc : [...acc, val.variant] ,[] as string[]))
  )
  public selectedSurfaceLayerId$ = this.store$.pipe(
    select(selectors.getSelectedSurfaceVariant)
  )

  constructor(
    private effect: ThreeSurferEffects,
    private el: ElementRef,
    private store$: Store,
    private navStateStoreRelay: ComponentStore<{ perspectiveOrientation: [number, number, number, number], perspectiveZoom: number }>,
    private sapi: SAPI,
    private snackbar: MatSnackBar,
    @Optional() intViewerStateSvc: ViewerInternalStateSvc,
    @Optional() @Inject(CLICK_INTERCEPTOR_INJECTOR) clickInterceptor: ClickInterceptor,
  ){
    if (intViewerStateSvc) {
      const {
        done,
        next,
      } = intViewerStateSvc.registerEmitter({
        "@type": 'TViewerInternalStateEmitter',
        viewerType,
        applyState: arg => {
          if (arg.viewerType === AUTO_ROTATE) {
            const autoPlayFlag = (arg.payload as any).play
            const reverseFlag = (arg.payload as any).reverse
            const autoplaySpeed = (arg.payload as any).speed
            this.toTsRef(tsRef => {
              tsRef.control.autoRotate = autoPlayFlag
              tsRef.control.autoRotateSpeed = autoplaySpeed * (reverseFlag ? -1 : 1)
            })
            return
          }
          if (arg.viewerType !== viewerType) return
          this.toTsRef(tsRef => {
            tsRef.camera.position.copy((arg.payload as any).camera)
          })
        }
      })
      this.internalStateNext = next
      this.onDestroyCb.push(() => done())
    }

    /**
     * intercept click and act
     */
    if (clickInterceptor) {
      const handleClick = (ev: MouseEvent) => {

        // if does not click inside container, ignore
        if (!(this.el.nativeElement as HTMLElement).contains(ev.target as HTMLElement)) {
          return true
        }
        
        if (this.mouseoverRegions.length === 0) return true
        if (this.mouseoverRegions.length > 1) {
          this.snackbar.open(CONST.DOES_NOT_SUPPORT_MULTI_REGION_SELECTION, 'Dismiss', {
            duration: 3000
          })
          return true
        }

        const regions = this.mouseoverRegions.slice(0, 1) as any[]
        this.store$.dispatch(
          atlasSelection.actions.setSelectedRegions({ regions })
        )
        return true
      }
      const { register, deregister } = clickInterceptor
      register(handleClick)
      this.onDestroyCb.push(
        () => { deregister(register) }
      )
    }
    
    this.domEl = this.el.nativeElement

    /**
     * subscribe to camera custom event
     */
    const cameraSub = this.cameraEv$.pipe(
      filter(v => !!v),
      debounceTime(160)
    ).subscribe(() => {
      
      const THREE = (window as any).ThreeSurfer.THREE
      
      const q = new THREE.Quaternion()
      const t = new THREE.Vector3()
      const s = new THREE.Vector3()

      /**
       * ThreeJS interpretes the scene differently to neuroglancer in subtle ways. 
       * At [0, 0, 0, 1] decomposed camera quaternion, for example,
       * - ThreeJS: view from superior -> inferior, anterior as top, right hemisphere as right
       * - NG: view from from inferior -> superior, posterior as top, left hemisphere as right
       * 
       * multiplying the exchange factor [-1, 0, 0, 0] converts ThreeJS convention to NG convention
       */
      const cameraM = this.tsRef.camera.matrix
      cameraM.decompose(t, q, s)
      const exchangeFactor = new THREE.Quaternion(-1, 0, 0, 0)

      try {
        this.navStateStoreRelay.setState({
          perspectiveOrientation: q.multiply(exchangeFactor).toArray(),
          perspectiveZoom: t.length()
        })
      } catch (_e) {
        // LockError, ignore
      }
    })

    this.onDestroyCb.push(
      () => cameraSub.unsubscribe()
    )

    /**
     * subscribe to navstore relay store and negotiate setting global state
     */
    const navStateSub = this.navStateStoreRelay.select(s => s).subscribe(v => {
      this.store$.dispatch(
        atlasSelection.actions.setNavigation({
          navigation: {
            position: [0, 0, 0],
            orientation: [0, 0, 0, 1],
            zoom: 1e6,
            perspectiveOrientation: v.perspectiveOrientation,
            perspectiveZoom: v.perspectiveZoom * pZoomFactor
          }
        })
      )
    })

    this.onDestroyCb.push(
      () => navStateSub.unsubscribe()
    )

    /**
     * subscribe to main store and negotiate with relay to set camera
     */
    const navSub = this.store$.pipe(
      select(atlasSelection.selectors.navigation),
      filter(v => !!v),
    ).subscribe(nav => {
      const { perspectiveOrientation, perspectiveZoom } = nav
      this.mainStoreCameraNav = {
        perspectiveOrientation,
        perspectiveZoom
      }

      if (!cameraNavsAreSimilar(this.mainStoreCameraNav, this.localCameraNav)) {
        this.relayStoreLock = this.navStateStoreRelay.getLock()
        const THREE = (window as any).ThreeSurfer.THREE
        
        const cameraQuat = new THREE.Quaternion(...this.mainStoreCameraNav.perspectiveOrientation)
        const cameraPos = new THREE.Vector3(0, 0, this.mainStoreCameraNav.perspectiveZoom / pZoomFactor)
        
        /**
         * ThreeJS interpretes the scene differently to neuroglancer in subtle ways. 
         * At [0, 0, 0, 1] decomposed camera quaternion, for example,
         * - ThreeJS: view from superior -> inferior, anterior as top, right hemisphere as right
         * - NG: view from from inferior -> superior, posterior as top, left hemisphere as right
         * 
         * multiplying the exchange factor [-1, 0, 0, 0] converts ThreeJS convention to NG convention
         */
        const exchangeFactor = new THREE.Quaternion(-1, 0, 0, 0)
        cameraQuat.multiply(exchangeFactor)

        cameraPos.applyQuaternion(cameraQuat)
        this.toTsRef(tsRef => {
          tsRef.camera.position.copy(cameraPos)
          if (this.relayStoreLock) this.relayStoreLock()
        })
      }
    })

    this.onDestroyCb.push(
      () => navSub.unsubscribe()
    )
  }

  private tsRef: TThreeSurfer
  private selectedRegions: SxplrRegion[] = []

  private relayStoreLock: () => void = null
  private tsRefInitCb: ((tsRef: any) => void)[] = []
  private toTsRef(callback: (tsRef: any) => void) {
    if (this.tsRef) {
      callback(this.tsRef)
      return
    }
    this.tsRefInitCb.push(callback)
  }

  private async loadMeshes(layers: ThreeSurferCustomLayer[]) {
    if (!this.tsRef) throw new Error(`loadMeshes error: this.tsRef is not defined!!`)

    /**
     * remove the layers... 
     */
    for (const layer of layers) {
      if (!!this.lateralityMeshRecord[layer.laterality]) {
        this.tsRef.unloadMesh(this.lateralityMeshRecord[layer.laterality].mesh)
      }
    }

    for (const layer of layers) {
      const threeMesh = await this.tsRef.loadMesh(layer.source)
      this.lateralityMeshRecord[layer.laterality] = {
        visible: true,
        meshLayer: layer,
        mesh: threeMesh
      }
    }
    this.applyColor()
  }

  private async loadVertexIndexMap(layers: ThreeSurferCustomLabelLayer[]) {
    if (!this.tsRef) throw new Error(`loadVertexIndexMap error: this.tsRef is not defined!!`)
    for (const layer of layers) {
      const giiInstance = await this.tsRef.loadColormap(layer.source)

      let labelIndices: number[] = giiInstance[0].getData()
      if (giiInstance[0].attributes.DataType === 'NIFTI_TYPE_INT16') {
        labelIndices = (window as any).ThreeSurfer.GiftiBase.castF32UInt16(labelIndices)
      }
      this.latLblIdxRecord[layer.laterality] = {
        indexLayer: layer,
        labelIndices
      }
    }
    this.applyColor()
  }

  private applyColor() {
    /**
     * on apply color map, reset mesh visibility
     * this issue is more difficult to solve than first anticiplated.
     * test scenarios:
     * 
     * 1/ hide hemisphere, select region
     * 2/ hide hemisphere, select region, unhide hemisphere
     * 3/ select region, hide hemisphere, deselect region
     */
    if (!this.colormapInUse) return
    if (!this.tsRef) return
    
    const isBaseCM = this.colormapInUse?.clType === "baselayer/colormap"

    for (const laterality in this.lateralityMeshRecord) {
      const { mesh } = this.lateralityMeshRecord[laterality]
      if (!this.latLblIdxRecord[laterality]) continue
      const { labelIndices } = this.latLblIdxRecord[laterality]

      const lblIdxToRegionRecord = this.latLblIdxToRegionRecord[laterality]
      if (!lblIdxToRegionRecord) {
        this.tsRef.applyColorMap(mesh, labelIndices)
        continue
      }
      const map = new Map<number, number[]>()
      for (const lblIdx in lblIdxToRegionRecord) {
        const region = lblIdxToRegionRecord[lblIdx]
        let color: number[]
        if (!this.showDelineation) {
          color = [1,1,1]
        } else if (isBaseCM && this.selectedRegions.length > 0 && !this.selectedRegions.includes(region)) {
          color = [1,1,1]
        } else {
          color = (this.colormapInUse.colormap.get(region) || [255, 255, 255]).map(v => v/255)
        }
        map.set(Number(lblIdx), color)
      }
      this.tsRef.applyColorMap(mesh, labelIndices, {
        custom: map
      })
    }
  }

  private handleCustomMouseEv(detail: any){
    const evMesh = detail.mesh && {
      faceIndex: detail.mesh.faceIndex,
      // typo in three-surfer
      verticesIndicies: detail.mesh.verticesIdicies
    }
    const custEv: THandlingCustomEv = {
      regions: [],
      evMesh
    }
    
    if (!detail.mesh) {
      return this.handleMouseoverEvent(custEv)
    }

    const {
      geometry: evGeometry,
      // typo in three-surfer
      verticesIdicies: evVerticesIndicies,
    } = detail.mesh as { geometry: TThreeGeometry, verticesIdicies: number[] }

    for (const laterality in this.lateralityMeshRecord) {
      const meshRecord = this.lateralityMeshRecord[laterality]
      if (meshRecord.mesh !== evGeometry) {
        continue
      }
      /**
       * if either labelindex record or colormap record is undefined for this laterality, emit empty event
       */
      if (!this.latLblIdxRecord[laterality] || !this.latLblIdxToRegionRecord[laterality]) {
        return this.handleMouseoverEvent(custEv)
      }
      const labelIndexRecord = this.latLblIdxRecord[laterality]
      const regionRecord = this.latLblIdxToRegionRecord[laterality]

      /**
       * check if the mesh is toggled off
       * if so, do not proceed
       */
      if (!meshRecord.visible) {
        return
      }

      /**
       * translate vertex indices to label indicies via set, to remove duplicates
       */
      const labelIndexSet = new Set<number>()
      for (const idx of evVerticesIndicies){
        const labelOfInterest = labelIndexRecord.labelIndices[idx]
        if (!labelOfInterest) {
          continue
        }
        labelIndexSet.add(labelOfInterest)
      }

      /**
       * decode label index to region
       */
      if (labelIndexSet.size === 0) {
        return this.handleMouseoverEvent(custEv)
      }
      for (const labelIndex of Array.from(labelIndexSet)) {
        if (!regionRecord[labelIndex]) {
          custEv.error = `${custEv.error || ''} Cannot decode label index ${labelIndex}`
          continue
        }
        const region = regionRecord[labelIndex]
        custEv.regions.push(region)
      }

      /**
       * return handle event
       */
      return this.handleMouseoverEvent(custEv)
    }
  }

  private cameraEv$ = new Subject<{ position: { x: number, y: number, z: number }, zoom: number }>()
  private handleCustomCameraEvent(detail: any){
    if (this.internalStateNext) {
      this.internalStateNext({
        "@id": getUuid(),
        "@type": 'TViewerInternalStateEmitterEvent',
        viewerType,
        payload: {
          mode: '',
          camera: detail.position,
          hemisphere: 'both'
        }
      })
    }
    this.cameraEv$.next(detail)
  }

  ngAfterViewInit(): void{
    const customEvHandler = (ev: CustomEvent) => {
      const { type, data } = ev.detail
      if (type === 'mouseover') {
        return this.handleCustomMouseEv(data)
      }
      if (type === 'camera') {
        return this.handleCustomCameraEvent(data)
      }
    }
    this.domEl.addEventListener((window as any).ThreeSurfer.CUSTOM_EVENTNAME_UPDATED, customEvHandler)
    this.onDestroyCb.push(
      () => this.domEl.removeEventListener((window as any).ThreeSurfer.CUSTOM_EVENTNAME_UPDATED, customEvHandler)
    )
    this.tsRef = new (window as any).ThreeSurfer(this.domEl, {highlightHovered: true})

    this.onDestroyCb.push(
      () => {
        this.tsRef.dispose()
        this.tsRef = null
      }
    )
    this.tsRef.control.enablePan = false
    while (this.tsRefInitCb.length > 0) {
      const tsCb = this.tsRefInitCb.pop()
      tsCb(this.tsRef)
    }

    const meshSub = this.meshLayers$.pipe(
      distinctUntilChanged(),
      debounceTime(16),
    ).subscribe(layers => {
      this.loadMeshes(layers)
    })
    const vertexIdxSub = this.vertexIndexLayers$.subscribe(layers => this.loadVertexIndexMap(layers))
    const roiSelectedSub = this.selectedRegions$.subscribe(regions => {
      this.selectedRegions = regions
      this.applyColor()
    })
    const colormapSub = this.colormaps$.subscribe(cm => {
      this.colormapInUse = cm[0] || null
      this.applyColor()
    })
    const recordToRegionSub = this.latLblIdxToRegionRecord$.subscribe(val => this.latLblIdxToRegionRecord = val)
    const hideDelineationSub = this.store$.pipe(
      select(atlasAppearance.selectors.showDelineation)
    ).subscribe(flag => {
      this.showDelineation = flag
      this.applyColor()
      /**
       * apply color resets mesh visibility
       */
      this.updateMeshVisibility()
    })

    this.onDestroyCb.push(() => {
      meshSub.unsubscribe()
      vertexIdxSub.unsubscribe()
      roiSelectedSub.unsubscribe()
      colormapSub.unsubscribe()
      recordToRegionSub.unsubscribe()
      hideDelineationSub.unsubscribe()
    })

    this.viewerEvent.emit({
      type: EnumViewerEvt.VIEWERLOADED,
      data: true
    })
  }

  public mouseoverText: string
  private handleMouseoverEvent(ev: THandlingCustomEv){
    const { regions: mouseover, evMesh, error } = ev
    this.mouseoverRegions = mouseover
    this.viewerEvent.emit({
      type: EnumViewerEvt.VIEWER_CTX,
      data: {
        viewerType: 'threeSurfer',
        payload: {
          fsversion: '',
          faceIndex: evMesh?.faceIndex,
          vertexIndices: evMesh?.verticesIndicies,
          position: [],
          regions: mouseover,
          error
        }
      }
    })
    this.mouseoverText = ''
    if (mouseover.length > 0) {
      this.mouseoverText += mouseover.map(el => el.name).join(' / ')
    }
    if (error) {
      this.mouseoverText += `::error: ${error}`
    }
    if (this.mouseoverText === '') this.mouseoverText = null
  }

  public updateMeshVisibility(): void{

    for (const key in this.lateralityMeshRecord) {

      const latMeshRecord = this.lateralityMeshRecord[key]
      if (!latMeshRecord) {
        return
      }
      const meshObj = this.tsRef.customColormap.get(latMeshRecord.mesh)
      if (!meshObj) {
        throw new Error(`mesh obj not found!`)
      }
      meshObj.mesh.visible = latMeshRecord.visible
    }
  }

  switchSurfaceLayer(variant: string): void{
    this.store$.dispatch(
      actions.selectSurfaceVariant({
        variant
      })
    )
  }

  private onDestroyCb: (() => void) [] = []

  ngOnDestroy(): void {
    while (this.onDestroyCb.length > 0) this.onDestroyCb.pop()()
  }
}
