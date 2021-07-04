import { Component, Input, Output, EventEmitter, ElementRef, OnChanges, OnDestroy, AfterViewInit } from "@angular/core";
import { EnumViewerEvt, IViewer, TViewerEvent } from "src/viewerModule/viewer.interface";
import { TThreeSurferConfig, TThreeSurferMode } from "../types";
import { parseContext } from "../util";
import { retry, flattenRegions } from 'common/util'
import { Subject } from "rxjs";
import { debounceTime, filter } from "rxjs/operators";
import { ComponentStore } from "src/viewerModule/componentStore";
import { select, Store } from "@ngrx/store";
import { viewerStateChangeNavigation } from "src/services/state/viewerState/actions";
import { viewerStateSelectorNavigation } from "src/services/state/viewerState/selectors";

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
  constructor(
    private el: ElementRef,
    private store$: Store<any>,
    private navStateStoreRelay: ComponentStore<{ perspectiveOrientation: [number, number, number, number], perspectiveZoom: number }>,
  ){
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
            perspectiveZoom: v.perspectiveZoom
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
        const cameraPos = new THREE.Vector3(0, 0, this.mainStoreCameraNav.perspectiveZoom)
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
      this.tsRef.applyColorMap(tsM, colorIdx, 
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
          const hemisphere = /left/.test(region.name)
            ? 'left'
            : /right/.test(region.name)
              ? 'right'
              : null
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
