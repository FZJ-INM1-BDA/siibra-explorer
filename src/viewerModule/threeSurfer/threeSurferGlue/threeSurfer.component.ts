import { Component, Output, EventEmitter, ElementRef, OnDestroy, AfterViewInit, Optional, ChangeDetectionStrategy } from "@angular/core";
import { EnumViewerEvt, IViewer, TViewerEvent } from "src/viewerModule/viewer.interface";
import { BehaviorSubject, combineLatest, concat, forkJoin, from, merge, NEVER, Observable, of, Subject } from "rxjs";
import { catchError, debounceTime, distinctUntilChanged, filter, map, scan, shareReplay, startWith, switchMap, tap, withLatestFrom } from "rxjs/operators";
import { ComponentStore, LockError } from "src/viewerModule/componentStore";
import { select, Store } from "@ngrx/store";
import { MatSnackBar } from "src/sharedModules/angularMaterial.exports"
import { getUuid, switchMapWaitFor } from "src/util/fn";
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
const pZoomFactor = 7e3

type THandlingCustomEv = {
  regions: SxplrRegion[]
  error?: string
  evMesh?: {
    faceIndex: number
    verticesIndicies: number[]
  }
}

type TLatVtxIdxRecord = LateralityRecord<{
  indexLayer: ThreeSurferCustomLabelLayer
  vertexIndices: number[]
}>

type TLatMeshRecord = LateralityRecord<{
  meshLayer: ThreeSurferCustomLayer
  mesh: TThreeGeometry
}>

type MeshVisOp = 'toggle' | 'noop'

type TApplyColorArg = LateralityRecord<{
  labelIndices: number[]
  idxReg: Record<number, SxplrRegion>
  isBaseCm: boolean
  showDelin: boolean
  selectedRegions: SxplrRegion[]
  mesh: TThreeGeometry
  vertexIndices: number[]
  map?: Map<number, number[]>
}>

type THandleCustomMouseEv = {
  latMeshRecord: TLatMeshRecord
  latLblIdxRecord: TLatVtxIdxRecord
  evDetail: any
  latLblIdxReg: TLatIdxReg
  meshVisibility: {
    label: string
    visible: boolean
    mesh: TThreeGeometry
  }[]
}

type TLatIdxReg = LateralityRecord<Record<number, SxplrRegion>>

type TLatCm = LateralityRecord<{
  labelIndices: number[]
  map: Map<number, number[]>
}>

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
  gridHelper: {
    visible: boolean
  }
}

type LateralityRecord<T> = Record<string, T>

const threshold = 1e-3

function cameraNavsAreSimilar(c1: TCameraOrientation, c2: TCameraOrientation){

  // if same reference, return true
  if (c1 === c2) return true

  // if both falsy, return true
  if (!c1 && !c2) return true

  if (!c1 && c2) return false
  if (!c2 && c1) return false

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

  #cameraEv$ = new Subject<{ position: { x: number, y: number, z: number }, zoom: number }>()
  #mouseEv$ = new Subject()
  
  @Output()
  viewerEvent = new EventEmitter<TViewerEvent<'threeSurfer'>>()

  private domEl: HTMLElement

  #storeNavigation = this.store$.pipe(
    select(atlasSelection.selectors.navigation)
  )

  #componentStoreNavigation = this.navStateStoreRelay.select(s => s)
  
  #internalNavigation = this.#cameraEv$.pipe(
    filter(v => !!v && !!(this.tsRef?.camera?.matrix)),
    map(() => {
      const { tsRef } = this
      return {
        _po: null,
        _pz: null,
        _calculate(){
          if (!tsRef) return
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
          const cameraM = tsRef.camera.matrix
          cameraM.decompose(t, q, s)
          const exchangeFactor = new THREE.Quaternion(-1, 0, 0, 0)
          this._po = q.multiply(exchangeFactor).toArray()
          this._pz = t.length() * pZoomFactor // use zoom as used in main store
        },
        get perspectiveOrientation(){
          if (!this._po) {
            this._calculate()
          }
          return this._po
        },
        get perspectiveZoom() {
          if (!this._pz) {
            this._calculate()
          }
          return this._pz
        }
      } as TCameraOrientation
    })
  )

  private internalStateNext: (arg: TInteralStatePayload<TInternalState>) => void

  private mouseoverRegions: SxplrRegion[] = []

  private customLayers$ = this.store$.pipe(
    select(atlasAppearance.selectors.customLayers),
    distinctUntilChanged(arrayEqual((o, n) => o.id === n.id)),
    shareReplay(1)
  )
  #meshLayers$: Observable<ThreeSurferCustomLayer[]> = this.customLayers$.pipe(
    map(layers => layers.filter(l => l.clType === "baselayer/threesurfer") as ThreeSurferCustomLayer[]),
    distinctUntilChanged(arrayEqual((o, n) => o.id === n.id)),
  )

  #lateralMeshRecord$ = new Subject<TLatMeshRecord>()
  lateralMeshRecord$ = concat(
    of({} as TLatMeshRecord),
    this.#lateralMeshRecord$.asObservable()
  )

  #meshVisOp$ = new Subject<{ op: MeshVisOp, label?: string }>()
  meshVisible$ = this.lateralMeshRecord$.pipe(
    map(v => {
      const returnVal: {
        label: string
        visible: boolean
        mesh: TThreeGeometry
      }[] = []
      for (const lat in v) {
        returnVal.push({
          visible: true,
          mesh: v[lat].mesh,
          label: lat
        })
      }
      return returnVal
    }),
    switchMap(arr => concat(
      of({ op: 'noop', label: null }),
      this.#meshVisOp$
    ).pipe(
      map(({ op, label }) => arr.map(v => {
        if (label !== v.label) {
          return v
        }
        if (op === "toggle") {
          v.visible = !v.visible
        }
        return v
      }))
    ))
  )

  private vertexIndexLayers$: Observable<ThreeSurferCustomLabelLayer[]> = this.customLayers$.pipe(
    map(layers => layers.filter(l => l.clType === "baselayer/threesurfer-label") as ThreeSurferCustomLabelLayer[]),
    distinctUntilChanged(arrayEqual((o, n) => o.id === n.id)),
  )

  #latVtxIdxRecord$: Observable<TLatVtxIdxRecord> = this.vertexIndexLayers$.pipe(
    switchMap(
      switchMapWaitFor({
        condition: () => !!this.tsRef,
        leading: true
      })
    ),
    switchMap(layers => 
      forkJoin(
        layers.map(layer => 
          from(
            this.tsRef.loadColormap(layer.source)
          ).pipe(
            map(giiInstance => {
              let vertexIndices: number[] = giiInstance[0].getData()
              if (giiInstance[0].attributes.DataType === 'NIFTI_TYPE_INT16') {
                vertexIndices = (window as any).ThreeSurfer.GiftiBase.castF32UInt16(vertexIndices)
              }
              return {
                indexLayer: layer,
                vertexIndices
              }
            })
          )
        )
      )
    ),
    map(layers => {
      const returnObj = {}
      for (const { indexLayer, vertexIndices } of layers) {
        returnObj[indexLayer.laterality] = { indexLayer, vertexIndices }
      }
      return returnObj
    })
  )

  /**
   * maps laterality to label index to sapi region
   */
  
  #latLblIdxToRegionRecord$: Observable<TLatIdxReg> = combineLatest([
    this.store$.pipe(
      atlasSelection.fromRootStore.distinctATP()
    ),
    this.store$.pipe(
      select(atlasSelection.selectors.selectedParcAllRegions),
    )
  ]).pipe(
    switchMap(([ { parcellation, template },  regions]) => {
      return merge(
        ...regions.map(region => 
          from(this.sapi.getRegionLabelIndices(template, parcellation, region)).pipe(
            map(label => ({ region, label })),
            catchError(() => NEVER)
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

  #colormaps$: Observable<ColorMapCustomLayer[]> = this.customLayers$.pipe(
    map(layers => layers.filter(l => l.clType === "baselayer/colormap" || l.clType === "customlayer/colormap") as ColorMapCustomLayer[]),
    distinctUntilChanged(arrayEqual((o, n) => o.id === n.id))
  )

  #latLblIdxToCm$ = combineLatest([
    this.#latLblIdxToRegionRecord$,
    this.#colormaps$
  ]).pipe(
    map(([ latIdxReg, cms ]) => {
      const cm = cms[0]
      const returnValue: TLatCm = {}
      if (!cm) {
        return returnValue
      }
      for (const lat in latIdxReg) {
        returnValue[lat] = {
          labelIndices: [],
          map: new Map()
        }
        for (const lblIdx in latIdxReg[lat]) {
          returnValue[lat].labelIndices.push(Number(lblIdx))
          const reg = latIdxReg[lat][lblIdx]
          returnValue[lat].map.set(
            Number(lblIdx), (cm.colormap.get(reg) || [255, 255, 255]).map(v => v/255)
          )
        }
      }
      return returnValue
    })
  )

  /**
   * when do we need to call apply color?
   * - when mesh loads
   * - when vertex index layer changes
   * - selected region changes
   * - custom color map added (by plugin, etc)
   * - show delineation updates
   */

  public threeSurferSurfaceVariants$ = this.effect.onATPDebounceThreeSurferLayers$.pipe(
    map(({ surfaces }) => surfaces.reduce((acc, val) => acc.includes(val.variant) ? acc : [...acc, val.variant] ,[] as string[]))
  )
  public selectedSurfaceLayerId$ = this.store$.pipe(
    select(selectors.getSelectedSurfaceVariant)
  )

  constructor(
    private effect: ThreeSurferEffects,
    el: ElementRef,
    private store$: Store,
    private navStateStoreRelay: ComponentStore<TCameraOrientation>,
    private sapi: SAPI,
    private snackbar: MatSnackBar,
    @Optional() intViewerStateSvc: ViewerInternalStateSvc,
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

    
    this.domEl = el.nativeElement

    /**
     * subscribe to camera custom event
     */
    const setReconcilState = merge(
      this.#internalNavigation.pipe(
        filter(v => !!v),
        tap(() => {
          try {
            this.releaseRelayLock = this.navStateStoreRelay.getLock()
          } catch (e) {
            if (!(e instanceof LockError)) {
              throw e
            }
          }
        }),
        debounceTime(160),
        tap(() => {
          if (this.releaseRelayLock) {
            this.releaseRelayLock()
            this.releaseRelayLock = null
          } else {
            console.warn(`this.releaseRelayLock not aquired, component may not function properly`)
          }  
        })
      ),
      this.#storeNavigation,
    ).pipe(
      filter(v => !!v)
    ).subscribe(nav => {
      try {
        this.navStateStoreRelay.setState({
          perspectiveOrientation: nav.perspectiveOrientation,
          perspectiveZoom: nav.perspectiveZoom
        })
      } catch (e) {
        if (!(e instanceof LockError)) {
          throw e
        }
      }
    })

    this.onDestroyCb.push(
      () => setReconcilState.unsubscribe()
    )

    /**
     * subscribe to navstore relay store and negotiate setting global state
     */
    const reconciliatorSub = combineLatest([
      this.#storeNavigation.pipe(
        startWith(null as TCameraOrientation)
      ),
      this.#componentStoreNavigation.pipe(
        startWith(null as TCameraOrientation),
      ),
      this.#internalNavigation.pipe(
        startWith(null as TCameraOrientation),
      )
    ]).pipe(
      debounceTime(160),
      filter(() => !this.navStateStoreRelay.isLocked)
    ).subscribe(([ storeNav, reconcilNav, internalNav ]) => {
      if (!cameraNavsAreSimilar(storeNav, reconcilNav) && reconcilNav) {
        this.store$.dispatch(atlasSelection.actions.setNavigation({
          navigation: {
            position: [0, 0, 0],
            orientation: [0, 0, 0, 1],
            zoom: 1e6,
            perspectiveOrientation: reconcilNav.perspectiveOrientation,
            perspectiveZoom: reconcilNav.perspectiveZoom
          }
        }))
      }

      if (!cameraNavsAreSimilar(reconcilNav, internalNav) && reconcilNav) {
        const THREE = (window as any).ThreeSurfer.THREE
        
        const cameraQuat = new THREE.Quaternion(...reconcilNav.perspectiveOrientation)
        const cameraPos = new THREE.Vector3(0, 0, reconcilNav.perspectiveZoom / pZoomFactor)
        
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
        })
      }
    })

    this.onDestroyCb.push(
      () => reconciliatorSub.unsubscribe()
    )
  }

  private tsRef: TThreeSurfer

  private releaseRelayLock: () => void = null
  private tsRefInitCb: ((tsRef: any) => void)[] = []
  private toTsRef(callback: (tsRef: any) => void) {
    if (this.tsRef) {
      callback(this.tsRef)
      return
    }
    this.tsRefInitCb.push(callback)
  }

  async #loadMeshes(layers: ThreeSurferCustomLayer[], currMeshRecord: TLatMeshRecord) {
    if (!this.tsRef) throw new Error(`loadMeshes error: this.tsRef is not defined!!`)
    const copiedCurrMeshRecord: TLatMeshRecord = {...currMeshRecord}
    /**
     * remove the layers... 
     */
    for (const layer of layers) {
      if (!!copiedCurrMeshRecord[layer.laterality]) {
        this.tsRef.unloadMesh(copiedCurrMeshRecord[layer.laterality].mesh)
      }
    }

    for (const layer of layers) {
      const threeMesh = await this.tsRef.loadMesh(layer.source)
      copiedCurrMeshRecord[layer.laterality] = {
        meshLayer: layer,
        mesh: threeMesh
      }
    }
    this.#lateralMeshRecord$.next(copiedCurrMeshRecord)
  }

  #applyColor$ = combineLatest([
    combineLatest([
      this.lateralMeshRecord$,
      this.store$.pipe(
        select(atlasSelection.selectors.selectedRegions),
        distinctUntilChanged(arrayEqual((o, n) => o.name === n.name))
      ),
      this.#colormaps$.pipe(
        map(cms => cms[0]),
        distinctUntilChanged((o, n) => o?.id === n?.id)
      ),
      this.store$.pipe(
        select(atlasAppearance.selectors.showDelineation),
        distinctUntilChanged()
      ),
      this.#latLblIdxToCm$,
      this.#latLblIdxToRegionRecord$,
    ]),
    this.#latVtxIdxRecord$
  ]).pipe(
    debounceTime(16),
    map(([[ latMeshDict, selReg, cm, showDelFlag, latLblIdxToCm, latLblIdxToRegionRecord ], latVtxIdx]) => {
      const arg: TApplyColorArg = {}
      for (const lat in latMeshDict) {
        arg[lat] = {
          mesh: latMeshDict[lat].mesh,
          selectedRegions: selReg,
          showDelin: showDelFlag,
          isBaseCm: cm.clType === "baselayer/colormap",
          labelIndices: latLblIdxToCm[lat].labelIndices,
          idxReg: latLblIdxToRegionRecord[lat],
          map: latLblIdxToCm[lat].map,
          vertexIndices: latVtxIdx[lat].vertexIndices
        }
      }
      return arg
    })
  )
  private applyColor(applyArg: TApplyColorArg) {
    /**
     * on apply color map, reset mesh visibility
     * this issue is more difficult to solve than first anticiplated.
     * test scenarios:
     * 
     * 1/ hide hemisphere, select region
     * 2/ hide hemisphere, select region, unhide hemisphere
     * 3/ select region, hide hemisphere, deselect region
     */
    
    if (!this.tsRef) return
    
    for (const laterality in applyArg) {
      const { labelIndices, map, mesh, showDelin, selectedRegions, isBaseCm, idxReg, vertexIndices } = applyArg[laterality]

      if (!map) {
        this.tsRef.applyColorMap(mesh, vertexIndices)
        continue
      }

      const actualApplyMap = new Map<number, number[]>()

      if (!showDelin) {
        for (const lblIdx of labelIndices){
          actualApplyMap.set(lblIdx, [1, 1, 1])
        }
        this.tsRef.applyColorMap(mesh, vertexIndices, {
          custom: actualApplyMap
        })
        continue
      }

      const highlightIdx = new Set<number>()
      if (isBaseCm && selectedRegions.length > 0) {
        for (const [idx, region] of Object.entries(idxReg)) {
          if (selectedRegions.findIndex(r => r.name === region.name) >= 0) {
            highlightIdx.add(Number(idx))
          }
        }
      }
      if (isBaseCm && selectedRegions.length > 0) {
        for (const lblIdx of labelIndices) {
          actualApplyMap.set(
            Number(lblIdx),
            highlightIdx.has(lblIdx)
            ? map.get(lblIdx) || [1, 0.8, 0.8]
            : [1, 1, 1]
          )
        }
      } else {
        for (const lblIdx of labelIndices) {
          actualApplyMap.set(
            Number(lblIdx),
            map.get(lblIdx) || [1, 0.8, 0.8]
          )
        }
      }
      this.tsRef.applyColorMap(mesh, vertexIndices, {
        custom: actualApplyMap
      })
    }
  }

  #handleCustomMouseEv$ = this.#mouseEv$.pipe(
    withLatestFrom(
      this.lateralMeshRecord$,
      this.#latLblIdxToRegionRecord$,
      this.meshVisible$,
      this.#latVtxIdxRecord$,
    )
  ).pipe(
    map(([ evDetail, latMeshRecord, latLblIdxReg, meshVis, latVtxIdx ]) => {
      const returnVal: THandleCustomMouseEv = {
        evDetail,
        meshVisibility: meshVis,
        latLblIdxReg: latLblIdxReg,
        latMeshRecord: latMeshRecord,
        latLblIdxRecord: latVtxIdx
      }
      return returnVal
    })
  )
  #handleCustomMouseEv(arg: THandleCustomMouseEv){
    const { evDetail: detail, latMeshRecord, latLblIdxRecord, latLblIdxReg, meshVisibility } = arg
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

    for (const laterality in latMeshRecord) {
      const meshRecord = latMeshRecord[laterality]
      if (meshRecord.mesh !== evGeometry) {
        continue
      }
      /**
       * if either labelindex record or colormap record is undefined for this laterality, emit empty event
       */
      if (!latLblIdxRecord[laterality] || !latLblIdxReg[laterality]) {
        return this.handleMouseoverEvent(custEv)
      }
      const labelIndexRecord = latLblIdxRecord[laterality]
      const regionRecord = latLblIdxReg[laterality]

      /**
       * check if the mesh is toggled off
       * if so, do not proceed
       */
      const mVis = meshVisibility.filter(({ mesh }) => mesh === meshRecord.mesh)
      if (!mVis.every(m => m.visible)) {
        return
      }

      /**
       * translate vertex indices to label indicies via set, to remove duplicates
       */
      const labelIndexSet = new Set<number>()
      for (const idx of evVerticesIndicies){
        const labelOfInterest = labelIndexRecord.vertexIndices[idx]
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

  ngAfterViewInit(): void{
    const customEvHandler = (ev: CustomEvent) => {
      const { type, data } = ev.detail
      if (type === 'mouseover') {
        this.#mouseEv$.next(data)
        return
      }
      if (type === 'camera') {
        if (this.internalStateNext) {
          this.internalStateNext({
            "@id": getUuid(),
            "@type": 'TViewerInternalStateEmitterEvent',
            viewerType,
            payload: {
              mode: '',
              camera: data.position,
              hemisphere: 'both'
            }
          })
        }
        this.#cameraEv$.next(data)
        return
      }
    }
    this.domEl.addEventListener((window as any).ThreeSurfer.CUSTOM_EVENTNAME_UPDATED, customEvHandler)
    this.onDestroyCb.push(
      () => this.domEl.removeEventListener((window as any).ThreeSurfer.CUSTOM_EVENTNAME_UPDATED, customEvHandler)
    )
    this.tsRef = new (window as any).ThreeSurfer(this.domEl, {highlightHovered: true})
    window['tsViewer'] = this.tsRef

    this.onDestroyCb.push(
      () => {
        this.tsRef.dispose()
        this.tsRef = null
        window['tsViewer'] = null
      }
    )
    this.tsRef.control.enablePan = false
    while (this.tsRefInitCb.length > 0) {
      const tsCb = this.tsRefInitCb.pop()
      tsCb(this.tsRef)
    }

    const meshSub = this.#meshLayers$.pipe(
      switchMap(
        switchMapWaitFor({
          condition: () => !!this.tsRef,
          leading: true
        })
      ),
      debounceTime(16),
      withLatestFrom(
        this.lateralMeshRecord$
      )
    ).subscribe(([layers, currMeshRecord]) => {
      this.#loadMeshes(layers, currMeshRecord)
    })
    
    const applyColorSub = this.#applyColor$.subscribe(arg => {
      this.applyColor(arg)
    })

    const mouseSub = this.#handleCustomMouseEv$.subscribe(arg => {
      this.#handleCustomMouseEv(arg)
    })

    const visibilitySub = this.meshVisible$.subscribe(arr => {
      for (const { visible, mesh } of arr) {
        mesh.visible = visible
        
        const meshObj = this.tsRef.customColormap.get(mesh)
        if (!meshObj) {
          throw new Error(`mesh obj not found!`)
        }
        meshObj.mesh.visible = visible
      }
    })

    this.onDestroyCb.push(() => {
      meshSub.unsubscribe()
      applyColorSub.unsubscribe()
      mouseSub.unsubscribe()
      visibilitySub.unsubscribe()
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
    if (error) {
      this.mouseoverText += `::error: ${error}`
    }
  }

  public toggleMeshVis(label: string) {
    this.#meshVisOp$.next({
      label,
      op: 'toggle'
    })
  }

  switchSurfaceLayer(variant: string): void{
    this.store$.dispatch(
      actions.selectSurfaceVariant({
        variant
      })
    )
  }

  gridVisible$ = new BehaviorSubject<boolean>(true)
  setGridVisibility(newFlag: boolean){
    this.tsRef.gridHelper.visible = newFlag
    this.gridVisible$.next(newFlag)
  }

  private onDestroyCb: (() => void) [] = []

  ngOnDestroy(): void {
    while (this.onDestroyCb.length > 0) this.onDestroyCb.pop()()
  }
}
