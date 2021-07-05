import { Component, Input, Output, EventEmitter, ElementRef, OnChanges, OnDestroy, AfterViewInit, Inject, Optional } from "@angular/core";
import { EnumViewerEvt, IViewer, TViewerEvent } from "src/viewerModule/viewer.interface";
import { TThreeSurferConfig, TThreeSurferMode } from "../types";
import { parseContext } from "../util";
import { retry, flattenRegions } from 'common/util'
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { debounceTime, filter, map, switchMap } from "rxjs/operators";
import { ComponentStore } from "src/viewerModule/componentStore";
import { select, Store } from "@ngrx/store";
import { viewerStateChangeNavigation, viewerStateSetSelectedRegions } from "src/services/state/viewerState/actions";
import { viewerStateSelectorNavigation } from "src/services/state/viewerState/selectors";
import { ClickInterceptor, CLICK_INTERCEPTOR_INJECTOR } from "src/util";
import { REGION_OF_INTEREST } from "src/util/interfaces";
import { MatSnackBar } from "@angular/material/snack-bar";
import { CONST } from 'common/constants'
import { API_SERVICE_SET_VIEWER_HANDLE_TOKEN, TSetViewerHandle } from "src/atlasViewer/atlasViewer.apiService.service";
import { switchMapWaitFor } from "src/util/fn";

const pZoomFactor = 5e3

type THandlingCustomEv = {
  regions: ({ name?: string, error?: string })[]
  evMesh?: {
    faceIndex: number
    verticesIndicies: number[]
  }
}

type TCameraOrientation = {
  perspectiveOrientation: [number, number, number, number]
  perspectiveZoom: number
}

const threshold = 1e-3

function getHemisphereKey(region: { name: string }){
  return /left/.test(region.name)
    ? 'left'
    : /right/.test(region.name)
      ? 'right'
      : null
}

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
  providers: [ ComponentStore ]
})

export class ThreeSurferGlueCmp implements IViewer<'threeSurfer'>, OnChanges, AfterViewInit, OnDestroy {

  @Input()
  selectedTemplate: any

  @Input()
  selectedParcellation: any
  
  @Output()
  viewerEvent = new EventEmitter<TViewerEvent<'threeSurfer'>>()

  private domEl: HTMLElement
  private config: TThreeSurferConfig
  public modes: TThreeSurferMode[] = []
  public selectedMode: string

  private mainStoreCameraNav: TCameraOrientation = null
  private localCameraNav: TCameraOrientation = null

  public allKeys: {name: string, checked: boolean}[] = []

  private regionMap: Map<string, Map<number, any>> = new Map()
  private mouseoverRegions = []
  constructor(
    private el: ElementRef,
    private store$: Store<any>,
    private navStateStoreRelay: ComponentStore<{ perspectiveOrientation: [number, number, number, number], perspectiveZoom: number }>,
    private snackbar: MatSnackBar,
    @Optional() @Inject(REGION_OF_INTEREST) private roi$: Observable<any>,
    @Optional() @Inject(CLICK_INTERCEPTOR_INJECTOR) clickInterceptor: ClickInterceptor,
    @Optional() @Inject(API_SERVICE_SET_VIEWER_HANDLE_TOKEN) setViewerHandle: TSetViewerHandle,
  ){

    // set viewer handle
    // the API won't be 100% compatible with ngviewer
    if (setViewerHandle) {
      const nyi = () => {
        throw new Error(`Not yet implemented`)
      }
      setViewerHandle({
        add3DLandmarks: nyi,
        loadLayer: nyi,
        applyLayersColourMap: (map: Map<string, Map<number, { red: number, green: number, blue: number }>>) => {
          const applyCm = new Map()
          for (const [hem, m] of map.entries()) {
            const nMap = new Map()
            applyCm.set(hem, nMap)
            for (const [lbl, vals] of m.entries()) {
              const { red, green, blue } = vals
              nMap.set(lbl, [red/255, green/255, blue/255])
            }
          }
          this.externalHemisphLblColorMap = applyCm
        },
        getLayersSegmentColourMap: () => {
          const map = this.getColormapCopy()
          const outmap = new Map<string, Map<number, { red: number, green: number, blue: number }>>()
          for (const [ hem, m ] of map.entries()) {
            const nMap = new Map<number, {red: number, green: number, blue: number}>()
            outmap.set(hem, nMap)
            for (const [ lbl, vals ] of m.entries()) {
              nMap.set(lbl, {
                red: vals[0] * 255,
                green: vals[1] * 255,
                blue: vals[2] * 255,
              })
            }
          }
          return outmap
        },
        getNgHash: nyi,
        hideAllSegments: nyi,
        hideSegment: nyi,
        mouseEvent: null, 
        mouseOverNehuba: null,
        mouseOverNehubaLayers: null,
        mouseOverNehubaUI: null,
        moveToNavigationLoc: null,
        moveToNavigationOri: null,
        remove3DLandmarks: null,
        removeLayer: null,
        setLayerVisibility: null,
        setNavigationLoc: null,
        setNavigationOri: null,
        showAllSegments: nyi,
        showSegment: nyi,
      })
    }

    if (this.roi$) {
      const sub = this.roi$.pipe(
        switchMap(switchMapWaitFor({
          condition: () => this.colormapLoaded
        }))
      ).subscribe(r => {
        try {
          if (!r) throw new Error(`No region selected.`)
          const cmap = this.getColormapCopy()
          const hemisphere = getHemisphereKey(r)
          if (!hemisphere) {
            this.snackbar.open(CONST.CANNOT_DECIPHER_HEMISPHERE, 'Dismiss', {
              duration: 3000
            })
            throw new Error(CONST.CANNOT_DECIPHER_HEMISPHERE)
          }
          for (const [ hem, m ] of cmap.entries()) {
            for (const lbl of m.keys()) {
              if (hem !== hemisphere || lbl !== r.labelIndex) {
                m.set(lbl, [1, 1, 1])
              }
            }
          }
          this.internalHemisphLblColorMap = cmap
        } catch (e) {
          this.internalHemisphLblColorMap = null
        }

        this.applyColorMap()
      })
      this.onDestroyCb.push(
        () => sub.unsubscribe()
      )
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
        this.store$.dispatch(
          viewerStateSetSelectedRegions({
            selectRegions: this.mouseoverRegions
          })
        )
        return true
      }
      const { register, deregister } = clickInterceptor
      register(handleClick)
      this.onDestroyCb.push(
        () => deregister(register)
      )
    }
    
    this.domEl = this.el.nativeElement

    /**
     * subscribe to camera custom event
     */
    const cameraSub = this.cameraEv$.pipe(
      filter(v => !!v),
      debounceTime(160)
    ).subscribe(ev => {
      const { position } = ev
      const { x, y, z } = position
      
      const THREE = (window as any).ThreeSurfer.THREE
      
      const q = new THREE.Quaternion()
      const t = new THREE.Vector3()
      const s = new THREE.Vector3()

      const cameraM = this.tsRef.camera.matrix
      cameraM.decompose(t, q, s)
      try {
        this.navStateStoreRelay.setState({
          perspectiveOrientation: q.toArray(),
          perspectiveZoom: t.length()
        })
      } catch (e) {
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
        viewerStateChangeNavigation({
          navigation: {
            position: [0, 0, 0],
            orientation: [0, 0, 0, 1],
            zoom: 1,
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
      select(viewerStateSelectorNavigation)
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

  tsRef: any
  loadedMeshes: {
    threeSurfer: any
    mesh: string
    colormap: string
    hemisphere: string
    vIdxArr: number[]
  }[] = []
  private hemisphLblColorMap: Map<string, Map<number, [number, number, number]>> = new Map()
  private internalHemisphLblColorMap: Map<string, Map<number, [number, number, number]>>
  private externalHemisphLblColorMap: Map<string, Map<number, [number, number, number]>>
  
  get activeColorMap() {
    if (this.externalHemisphLblColorMap) return this.externalHemisphLblColorMap
    if (this.internalHemisphLblColorMap) return this.internalHemisphLblColorMap
    return this.hemisphLblColorMap
  }
  private relayStoreLock: () => void = null
  private tsRefInitCb: ((tsRef: any) => void)[] = []
  private toTsRef(callback: (tsRef: any) => void) {
    if (this.tsRef) {
      callback(this.tsRef)
      return
    }
    this.tsRefInitCb.push(callback)
  }

  private unloadAllMeshes() {
    this.allKeys = []
    while(this.loadedMeshes.length > 0) {
      const m = this.loadedMeshes.pop()
      this.tsRef.unloadMesh(m.threeSurfer)
    }
    this.hemisphLblColorMap.clear()
    this.colormapLoaded = false
  }

  public async loadMode(mode: TThreeSurferMode) {
    
    this.unloadAllMeshes()

    this.selectedMode = mode.name
    const { meshes } = mode
    await retry(async () => {
      for (const singleMesh of meshes) {
        const { hemisphere } = singleMesh
        if (!this.regionMap.has(hemisphere)) throw new Error(`regionmap does not have hemisphere defined!`)
      }
    }, {
      timeout: 32,
      retries: 10
    })
    for (const singleMesh of meshes) {
      const { mesh, colormap, hemisphere } = singleMesh
      this.allKeys.push({name: hemisphere, checked: true})

      const tsM = await this.tsRef.loadMesh(
        parseContext(mesh, [this.config['@context']])
      )

      if (!this.regionMap.has(hemisphere)) continue
      const rMap = this.regionMap.get(hemisphere)
      const applyCM = new Map()
      for (const [ lblIdx, region ] of rMap.entries()) {
        applyCM.set(lblIdx, (region.rgb || [200, 200, 200]).map(v => v/255))
      }

      const tsC = await this.tsRef.loadColormap(
        parseContext(colormap, [this.config['@context']])
      )
      
      let colorIdx = tsC[0].getData()
      if (tsC[0].attributes.DataType === 'NIFTI_TYPE_INT16') {
        colorIdx = (window as any).ThreeSurfer.GiftiBase.castF32UInt16(colorIdx)
      }

      this.loadedMeshes.push({
        threeSurfer: tsM,
        colormap,
        mesh,
        hemisphere,
        vIdxArr: colorIdx
      })

      this.hemisphLblColorMap.set(hemisphere, applyCM)
    }
    this.colormapLoaded = true
    this.applyColorMap()
  }

  private colormapLoaded = false

  private getColormapCopy(): Map<string, Map<number, [number, number, number]>> {
    const outmap = new Map()
    for (const [key, value] of this.hemisphLblColorMap.entries()) {
      outmap.set(key, new Map(value))
    }
    return outmap
  }

  /**
   * TODO perhaps debounce calls to applycolormap
   * so that the colormap doesn't "flick"
   */
  private applyColorMap(){
    for (const mesh of this.loadedMeshes) {
      const { hemisphere, threeSurfer, vIdxArr } = mesh
      const applyCM = this.activeColorMap.get(hemisphere)
      this.tsRef.applyColorMap(threeSurfer, vIdxArr, 
        {
          custom: applyCM
        }
      )
    }
  }

  async ngOnChanges(){
    if (this.tsRef) {
      this.ngOnDestroy()
      this.ngAfterViewInit()
    }
    if (this.selectedTemplate) {

      /**
       * wait until threesurfer is defined in window
       */
      await retry(async () => {
        if (typeof (window as any).ThreeSurfer === 'undefined') throw new Error('ThreeSurfer not yet defined')
      }, {
        timeout: 160,
        retries: 10,
      })
      
      this.config = this.selectedTemplate['three-surfer']
      // somehow curv ... cannot be parsed properly by gifti parser... something about points missing
      this.modes = this.config.modes.filter(m => !/curv/.test(m.name))
      if (!this.tsRef) {
        this.tsRef = new (window as any).ThreeSurfer(this.domEl, {highlightHovered: true})
        this.onDestroyCb.push(
          () => {
            this.tsRef.dispose()
            this.tsRef = null
          }
        );
        (window as any).tsRef = this.tsRef
        while (this.tsRefInitCb.length > 0) this.tsRefInitCb.pop()(this.tsRef)
      }

      const flattenedRegions = flattenRegions(this.selectedParcellation.regions)
      for (const region of flattenedRegions) {
        if (region.labelIndex) {
          const hemisphere = getHemisphereKey(region)
          if (!hemisphere) throw new Error(`region ${region.name} does not have hemisphere defined`)
          if (!this.regionMap.has(hemisphere)) {
            this.regionMap.set(hemisphere, new Map())
          }
          const rMap = this.regionMap.get(hemisphere)
          rMap.set(region.labelIndex, region)
        }
      }
      
      // load mode0 by default
      this.loadMode(this.config.modes[0])

      this.viewerEvent.emit({
        type: EnumViewerEvt.VIEWERLOADED,
        data: true
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

    const evGeom = detail.mesh.geometry
    const evVertIdx = detail.mesh.verticesIdicies
    const found = this.loadedMeshes.find(({ threeSurfer }) => threeSurfer === evGeom)
    if (!found) return this.handleMouseoverEvent(custEv)

    /**
     * check if the mesh is toggled off
     * if so, do not proceed
     */
    const checkKey = this.allKeys.find(key => key.name === found.hemisphere)
    if (checkKey && !checkKey.checked) return

    const { hemisphere: key, vIdxArr } = found

    if (!key || !evVertIdx) {
      return this.handleMouseoverEvent(custEv)
    }

    const labelIdxSet = new Set<number>()
    
    for (const vIdx of evVertIdx) {
      labelIdxSet.add(
        vIdxArr[vIdx]
      )
    }
    if (labelIdxSet.size === 0) {
      return this.handleMouseoverEvent(custEv)
    }

    const hemisphereMap = this.regionMap.get(key)

    if (!hemisphereMap) {
      custEv.regions = Array.from(labelIdxSet).map(v => {
        return {
          error: `unknown#${v}`
        }
      })
      return this.handleMouseoverEvent(custEv)
    }

    custEv.regions =  Array.from(labelIdxSet)
      .map(lblIdx => {
        const ontoR = hemisphereMap.get(lblIdx)
        if (ontoR) {
          return ontoR
        } else {
          return {
            error: `unkonwn#${lblIdx}`
          }
        }
      })
    return this.handleMouseoverEvent(custEv)

  }

  private cameraEv$ = new Subject<{ position: { x: number, y: number, z: number }, zoom: number }>()
  private handleCustomCameraEvent(detail: any){
    this.cameraEv$.next(detail)
  }

  ngAfterViewInit(){
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
  }

  public mouseoverText: string
  private handleMouseoverEvent(ev: THandlingCustomEv){
    const { regions: mouseover, evMesh } = ev
    this.mouseoverRegions = mouseover
    this.viewerEvent.emit({
      type: EnumViewerEvt.VIEWER_CTX,
      data: {
        viewerType: 'threeSurfer',
        payload: {
          fsversion: this.selectedMode,
          faceIndex: evMesh?.faceIndex,
          vertexIndices: evMesh?.verticesIndicies,
          position: [],
          _mouseoverRegion: mouseover.filter(el => !el.error)
        }
      }
    })
    this.mouseoverText = mouseover.length === 0 ?
      null :
      mouseover.map(
        el => el.name || el.error
      ).join(' / ')
  }

  public handleCheckBox(key: { name: string, checked: boolean }, flag: boolean){
    const foundMesh = this.loadedMeshes.find(m => m.hemisphere === key.name)
    if (!foundMesh) {
      throw new Error(`Cannot find mesh with name: ${key.name}`)
    }
    const meshObj = this.tsRef.customColormap.get(foundMesh.threeSurfer)
    if (!meshObj) {
      throw new Error(`mesh obj not found!`)
    }
    meshObj.mesh.visible = flag
  }

  private onDestroyCb: (() => void) [] = []

  ngOnDestroy() {
    while (this.onDestroyCb.length > 0) this.onDestroyCb.pop()()
  }
}
