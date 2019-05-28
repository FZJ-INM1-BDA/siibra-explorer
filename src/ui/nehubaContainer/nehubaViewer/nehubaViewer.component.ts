import { Component, OnDestroy, Output, EventEmitter, ElementRef, NgZone, Renderer2 } from "@angular/core";
import 'third_party/export_nehuba/main.bundle.js'
import 'third_party/export_nehuba/chunk_worker.bundle.js'
import { fromEvent, interval, Observable } from 'rxjs'
import { AtlasWorkerService } from "../../../atlasViewer/atlasViewer.workerService.service";
import { buffer, map, filter, debounceTime, take, takeUntil, scan, switchMap, takeWhile } from "rxjs/operators";
import { AtlasViewerConstantsServices } from "../../../atlasViewer/atlasViewer.constantService.service";
import { takeOnePipe, identifySrcElement } from "../nehubaContainer.component";
import { ViewerConfiguration } from "src/services/state/viewerConfig.store";
import { pipeFromArray } from "rxjs/internal/util/pipe";
import { getNgIdLabelIndexFromId } from "src/services/stateStore.service";

/**
 * no selector is needed, as currently, nehubaviewer is created dynamically
 */
@Component({
  templateUrl : './nehubaViewer.template.html',
  styleUrls : [
    './nehubaViewer.style.css'
  ]
})

export class NehubaViewerUnit implements OnDestroy{
  
  @Output() nehubaReady: EventEmitter<null> = new EventEmitter()
  @Output() debouncedViewerPositionChange : EventEmitter<any> = new EventEmitter()
  @Output() mouseoverSegmentEmitter: 
    EventEmitter<{
      segmentId: number | null,
      segment:string | null,
      layer:{
        name?: string,
        url?: string
      }
    }> = new EventEmitter()
  @Output() mouseoverLandmarkEmitter : EventEmitter<number | null> = new EventEmitter()
  @Output() regionSelectionEmitter : EventEmitter<{segment:number, layer:{name?: string, url?: string}}> = new EventEmitter()
  @Output() errorEmitter : EventEmitter<any> = new EventEmitter()

  /* only used to set initial navigation state */
  initNav : any
  initRegions : any[]
  initNiftiLayers : any[] = []

  config : any
  nehubaViewer : any
  private _dim: [number, number, number]
  get dim(){
    return this._dim
      ? this._dim
      : [1.5e9, 1.5e9, 1.5e9]
  }

  _s1$ : any
  _s2$ : any
  _s3$ : any
  _s4$ : any
  _s5$ : any
  _s6$ : any
  _s7$ : any
  _s8$ : any
  _s9$ : any

  _s$ : any[] = [
    this._s1$,
    this._s2$,
    this._s3$,
    this._s4$,
    this._s5$,
    this._s6$,
    this._s7$,
    this._s8$,
    this._s9$
  ]

  ondestroySubscriptions: any[] = []

  touchStart$ : Observable<any>

  constructor(
    private rd: Renderer2,
    public elementRef:ElementRef,
    private workerService : AtlasWorkerService,
    private zone : NgZone,
    public constantService : AtlasViewerConstantsServices
  ){

    if(!this.constantService.loadExportNehubaPromise){
      this.constantService.loadExportNehubaPromise = new Promise((resolve, reject) => {
        const scriptEl = this.rd.createElement('script')
        scriptEl.src = 'main.bundle.js'
        scriptEl.onload = () => resolve(true)
        scriptEl.onerror = (e) => reject(e)
        this.rd.appendChild(window.document.head, scriptEl)
      })
    }

    this.constantService.loadExportNehubaPromise
      .then(() => {
        const fixedZoomPerspectiveSlices = this.config && this.config.layout && this.config.layout.useNehubaPerspective && this.config.layout.useNehubaPerspective.fixedZoomPerspectiveSlices
        if (fixedZoomPerspectiveSlices) {
          const { sliceZoom, sliceViewportWidth, sliceViewportHeight } = fixedZoomPerspectiveSlices
          const dim = Math.min(sliceZoom * sliceViewportWidth, sliceZoom * sliceViewportHeight)
          this._dim = [dim, dim, dim]
        }
        this.patchNG()
        this.loadNehuba()
      })
      .catch(e => this.errorEmitter.emit(e))

    this.ondestroySubscriptions.push(
      fromEvent(this.workerService.worker, 'message').pipe(
        filter((message:any) => {

          if(!message){
            // console.error('worker response message is undefined', message)
            return false
          }
          if(!message.data){
            // console.error('worker response message.data is undefined', message.data)
            return false
          }
          if(message.data.type !== 'ASSEMBLED_LANDMARKS_VTK'){
            /* worker responded with not assembled landmark, no need to act */
            return false
          }
          if(!message.data.url){
            /* file url needs to be defined */
            return false
          }
          return true
        }),
        debounceTime(100),
        filter(e => this.templateId === e.data.template),
        map(e => e.data.url)
      ).subscribe(url => {
        this.removeSpatialSearch3DLandmarks()
        const _ = {}
        _[this.constantService.ngLandmarkLayerName] = {
          type :'mesh',
          source : `vtk://${url}`,
          shader : FRAGMENT_MAIN_WHITE
        }
        this.loadLayer(_)
      })
    )

    this.ondestroySubscriptions.push(
      fromEvent(this.workerService.worker, 'message').pipe(
        filter((message:any) => {

          if(!message){
            // console.error('worker response message is undefined', message)
            return false
          }
          if(!message.data){
            // console.error('worker response message.data is undefined', message.data)
            return false
          }
          if(message.data.type !== 'ASSEMBLED_USERLANDMARKS_VTK'){
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
        map(e => e.data.url)
      ).subscribe(url => {
        this.removeuserLandmarks()

        /**
         * url may be null if user removes all landmarks
         */
        if (!url) return
        const _ = {}
        _[this.constantService.ngUserLandmarkLayerName] = {
          type :'mesh',
          source : `vtk://${url}`,
          shader : FRAGMENT_MAIN_WHITE
        }
        this.loadLayer(_)
      })
    )

    this.ondestroySubscriptions.push(

      fromEvent(this.workerService.worker,'message').pipe(
        filter((message:any) => {
  
          if(!message){
            // console.error('worker response message is undefined', message)
            return false
          }
          if(!message.data){
            // console.error('worker response message.data is undefined', message.data)
            return false
          }
          if(message.data.type !== 'CHECKED_MESH'){
            /* worker responded with not checked mesh, no need to act */
            return false
          }
          return true
        }),
        map(e => e.data),
        buffer(interval(1000)),
        map(arr => arr.reduce((acc:Map<string,Set<number>>,curr)=> {
          
          const newMap = new Map(acc)
          const set = newMap.get(curr.baseUrl)
          if(set){
            set.add(curr.checkedIndex)
          }else{
            newMap.set(curr.baseUrl,new Set([curr.checkedIndex]))
          }
          return newMap
        }, new Map()))
      ).subscribe(map => {
        
        Array.from(map).forEach(item => {
          const baseUrl : string = item[0]
          const set : Set<number> = item[1]
  
          /* validation passed, add to safeMeshSet */
          const oldset = this.workerService.safeMeshSet.get(baseUrl)
          if(oldset){
            this.workerService.safeMeshSet.set(baseUrl, new Set([...oldset, ...set]))
          }else{
            this.workerService.safeMeshSet.set(baseUrl, new Set([...set]))
          }
  
          /* if the active parcellation is the current parcellation, load the said mesh */
          const baseUrlIsInLoadedBaseUrlList = new Set([...this._baseUrls]).has(baseUrl)
          const baseUrlParcellationId = this._baseUrlToParcellationIdMap.get(baseUrl)
          if( baseUrlIsInLoadedBaseUrlList && baseUrlParcellationId){
            this.nehubaViewer.setMeshesToLoad([...this.workerService.safeMeshSet.get(baseUrl)], {
              name : baseUrlParcellationId
            })
          }
        })
      })
    )
  }

  private _baseUrlToParcellationIdMap:Map<string, string> = new Map()
  private _baseUrls: string[] = []

  get numMeshesToBeLoaded():number{
    if(!this._baseUrls || this._baseUrls.length === 0)
      return 0

    return this._baseUrls.reduce((acc, curr) => {
      const mappedSet = this.workerService.safeMeshSet.get(curr)
      return acc + ((mappedSet && mappedSet.size) || 0)
    } ,0)
  }

  public applyPerformanceConfig ({ gpuLimit }: Partial<ViewerConfiguration>) {
    if (gpuLimit && this.nehubaViewer) {
      const limit = this.nehubaViewer.ngviewer.state.children.get('gpuMemoryLimit')
      if (limit && limit.restoreState) {
        limit.restoreState(gpuLimit)
      }
    }
  }

  /* required to check if correct landmarks are loaded */
  private _templateId : string
  get templateId(){
    return this._templateId
  }
  set templateId(id:string){
    this._templateId = id
  }

  /** compatible with multiple parcellation id selection */
  private _ngIds: string[] = []
  get ngIds(){
    return this._ngIds
  }

  set ngIds(val:string[]){

    if(this.nehubaViewer){
      this._ngIds.forEach(id => {
        const oldlayer = this.nehubaViewer.ngviewer.layerManager.getLayerByName(id)
        if(oldlayer)oldlayer.setVisible(false)
        else console.warn('could not find old layer', id)
      })
    }

    this._ngIds = val
    
    if(this.nehubaViewer)
      this.loadNewParcellation()
  }

  spatialLandmarkSelectionChanged(labels:number[]){
    const getCondition = (label:number) => `if(label > ${label - 0.1} && label < ${label + 0.1} ){${FRAGMENT_EMIT_RED}}`
    const newShader = `void main(){ ${labels.map(getCondition).join('else ')}else {${FRAGMENT_EMIT_WHITE}} }`
    if(!this.nehubaViewer){
      if(!PRODUCTION || window['__debug__'])
        console.warn('setting special landmark selection changed failed ... nehubaViewer is not yet defined')
      return
    }
    const landmarkLayer = this.nehubaViewer.ngviewer.layerManager.getLayerByName(this.constantService.ngLandmarkLayerName)
    if(!landmarkLayer){
      if(!PRODUCTION || window['__debug__'])
        console.warn('landmark layer could not be found ... will not update colour map')
      return
    }
    if(labels.length === 0){
      landmarkLayer.layer.displayState.fragmentMain.restoreState(FRAGMENT_MAIN_WHITE)  
    }else{
      landmarkLayer.layer.displayState.fragmentMain.restoreState(newShader)
    }
  }

  multiNgIdsLabelIndexMap: Map<string, Map<number, any>>

  navPosReal : [number,number,number] = [0,0,0]
  navPosVoxel : [number,number,number] = [0,0,0]

  mousePosReal : [number,number,number] = [0,0,0]
  mousePosVoxel : [number,number,number] = [0,0,0]

  viewerState : ViewerState

  private multiNgIdColorMap: Map<string, Map<number, {red: number, green:number, blue: number}>>
  public mouseOverSegment: number | null
  public mouseOverLayer: {name:string,url:string}| null

  private viewportToDatas : [any, any, any] = [null, null, null]

  public getNgHash : () => string = () => window['export_nehuba']
    ? window['export_nehuba'].getNgHash()
    : null

  loadNehuba(){
    this.nehubaViewer = window['export_nehuba'].createNehubaViewer(this.config, (err)=>{
      /* print in debug mode */
      console.log(err)
    })

    /**
     * Hide all layers except the base layer (template)
     * Then show the layers referenced in multiNgIdLabelIndexMap
     */
    const managedLayers = this.nehubaViewer.ngviewer.layerManager.managedLayers
    managedLayers.slice(1).forEach(layer=>layer.setVisible(false))
    Array.from(this.multiNgIdsLabelIndexMap.keys()).forEach(ngId => {
      const layer = this.nehubaViewer.ngviewer.layerManager.getLayerByName(ngId)
      if (layer) layer.setVisible(true)
      else console.log('layer unavailable', ngId)
    })
    this.nehubaViewer.redraw()

    /* creation of the layout is done on next frame, hence the settimeout */
    setTimeout(() => {
      window['viewer'].display.panels.forEach(patchSliceViewPanel) 
      this.nehubaReady.emit(null)
    })
    
    this.newViewerInit()
    this.loadNewParcellation()

    window['nehubaViewer'] = this.nehubaViewer

    this.onDestroyCb.push(() => window['nehubaViewer'] = null)

    this.ondestroySubscriptions.push(
      // fromEvent(this.elementRef.nativeElement, 'viewportToData').pipe(
      //   ...takeOnePipe
      // ).subscribe((events:CustomEvent[]) => {
      //   [0,1,2].forEach(idx => this.viewportToDatas[idx] = events[idx].detail.viewportToData)
      // })
      pipeFromArray([...takeOnePipe])(fromEvent(this.elementRef.nativeElement, 'viewportToData'))
      .subscribe((events:CustomEvent[]) => {
        [0,1,2].forEach(idx => this.viewportToDatas[idx] = events[idx].detail.viewportToData)
      })
    )

    this.touchStart$ = fromEvent(this.elementRef.nativeElement, 'touchstart').pipe(
      map((ev:TouchEvent) => {
        const srcElement : HTMLElement = ev.srcElement || (ev as any).originalTarget
        return {
          startPos: [ev.touches[0].screenX, ev.touches[0].screenY],
          elementId: identifySrcElement(srcElement),
          srcElement,
          event: ev
        }
      })
    )

    this.ondestroySubscriptions.push(

      this.touchStart$.pipe(
        switchMap(({startPos, elementId, srcElement}) => fromEvent(this.elementRef.nativeElement,'touchmove').pipe(
          map((ev: TouchEvent) => (ev.stopPropagation(), ev.preventDefault(), ev)),
          filter((ev:TouchEvent) => ev.touches.length === 1),
          map((event:TouchEvent) => ({
            startPos,
            event,
            elementId,
            srcElement
          })),
          scan((acc,ev:any) => {
            return acc.length < 2
              ? acc.concat(ev)
              : acc.slice(1).concat(ev)
          },[]),
          map(double => ({
            elementId: double[0].elementId,
            deltaX: double.length === 1
              ? null // startPos[0] - (double[0].event as TouchEvent).touches[0].screenX
              : double.length === 2
                ? (double[0].event as TouchEvent).touches[0].screenX - (double[1].event as TouchEvent).touches[0].screenX 
                : null,
            deltaY: double.length === 1
              ? null // startPos[0] - (double[0].event as TouchEvent).touches[0].screenY
              : double.length === 2
                ? (double[0].event as TouchEvent).touches[0].screenY - (double[1].event as TouchEvent).touches[0].screenY 
                : null
          })),
          takeUntil(fromEvent(this.elementRef.nativeElement, 'touchend').pipe(filter((ev: TouchEvent) => ev.touches.length === 0)))
        ))
      ).subscribe(({ elementId, deltaX, deltaY }) => {
        if(deltaX === null || deltaY === null){
          console.warn('deltax/y is null')
          return
        }
        if(elementId === 0 || elementId === 1 || elementId === 2){
          const {position} = this.nehubaViewer.ngviewer.navigationState 
          const pos = position.spatialCoordinates
          window['export_nehuba'].vec3.set(pos, deltaX, deltaY, 0)
          window['export_nehuba'].vec3.transformMat4(pos, pos, this.viewportToDatas[elementId])
          position.changed.dispatch()
        }else if(elementId === 3){
          const {perspectiveNavigationState} = this.nehubaViewer.ngviewer
          perspectiveNavigationState.pose.rotateRelative(this.vec3([0, 1, 0]), -deltaX / 4.0 * Math.PI / 180.0)
          perspectiveNavigationState.pose.rotateRelative(this.vec3([1, 0, 0]), deltaY / 4.0 * Math.PI / 180.0)
          this.nehubaViewer.ngviewer.perspectiveNavigationState.changed.dispatch()
        }
      })
    )

    this.ondestroySubscriptions.push(
      this.touchStart$.pipe(
        switchMap(() => 
          fromEvent(this.elementRef.nativeElement, 'touchmove').pipe(
            takeWhile((ev:TouchEvent) => ev.touches.length === 2),
            map((ev:TouchEvent) => computeDistance(
                [ev.touches[0].screenX, ev.touches[0].screenY],
                [ev.touches[1].screenX, ev.touches[1].screenY]
              )),
            scan((acc, curr:number) => acc.length < 2
              ? acc.concat(curr)
              : acc.slice(1).concat(curr), []),
            filter(dist => dist.length > 1),
            map(dist => dist[0] / dist[1])
          ))
      ).subscribe(factor => 
        this.nehubaViewer.ngviewer.navigationState.zoomBy(factor))
    )
  }

  ngOnDestroy(){
    this._s$.forEach(_s$=>{
      if(_s$) _s$.unsubscribe()
    })
    this.ondestroySubscriptions.forEach(s => s.unsubscribe())
    while(this.onDestroyCb.length > 0){
      this.onDestroyCb.pop()()
    }
    this.nehubaViewer.dispose()
  }

  private onDestroyCb : (()=>void)[] = []

  private patchNG(){

    const { LayerManager, UrlHashBinding } = window['export_nehuba'].getNgPatchableObj()
    
    UrlHashBinding.prototype.setUrlHash = () => {
      // console.log('seturl hash')
      // console.log('setting url hash')
    }

    UrlHashBinding.prototype.updateFromUrlHash = () => {
      // console.log('update hash binding')
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

    this.onDestroyCb.push(() => LayerManager.prototype.invokeAction = (arg) => {})
  }

  private filterLayers(l:any,layerObj:any):boolean{
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
        )
      )
  }

  // TODO single landmark for user landmark
  public updateUserLandmarks(landmarks:any[]){
    if(!this.nehubaViewer)
      return
    this.workerService.worker.postMessage({
      type : 'GET_USERLANDMARKS_VTK',
      scale: Math.min(...this.dim.map(v => v * this.constantService.nehubaLandmarkConstant)),
      landmarks : landmarks.map(lm => lm.position.map(coord => coord * 1e6))
    })
  }

  public removeSpatialSearch3DLandmarks(){
    this.removeLayer({
      name : this.constantService.ngLandmarkLayerName
    })
  }

  public removeuserLandmarks(){
    this.removeLayer({
      name : this.constantService.ngUserLandmarkLayerName
    })
  }

  //pos in mm
  public addSpatialSearch3DLandmarks(geometries: any[],scale?:number,type?:'icosahedron'){
    this.workerService.worker.postMessage({
      type : 'GET_LANDMARKS_VTK',
      template : this.templateId,
      scale: Math.min(...this.dim.map(v => v * this.constantService.nehubaLandmarkConstant)),
      landmarks : geometries.map(geometry => 
        geometry === null
          ? null
          //gemoetry : [number,number,number] | [ [number,number,number][], [number,number,number][] ]
          : isNaN(geometry[0])
            ? [geometry[0].map(triplets => triplets.map(coord => coord * 1e6)), geometry[1]]
            : geometry.map(coord => coord * 1e6)
      )
    })
  }

  public setLayerVisibility(condition:{name:string|RegExp},visible:boolean){
    if(!this.nehubaViewer)
      return false
    const viewer = this.nehubaViewer.ngviewer
    viewer.layerManager.managedLayers
      .filter(l=>this.filterLayers(l,condition))
      .map(layer=>layer.setVisible(visible))
  }

  public removeLayer(layerObj:any){
    if(!this.nehubaViewer)
      return false
    const viewer = this.nehubaViewer.ngviewer
    const removeLayer = (i) => (viewer.layerManager.removeManagedLayer(i),i.name)

    return viewer.layerManager.managedLayers
      .filter(l=>this.filterLayers(l,layerObj))
      .map(removeLayer)
  }

  public loadLayer(layerObj:any){
    const viewer = this.nehubaViewer.ngviewer
    return Object.keys(layerObj)
      .filter(key=>
        /* if the layer exists, it will not be loaded */
        !viewer.layerManager.getLayerByName(key))
      .map(key=>{
        viewer.layerManager.addManagedLayer(
          viewer.layerSpecification.getLayer(key,layerObj[key]))

        return layerObj[key]
      })
  }

  public hideAllSeg(){
    if(!this.nehubaViewer) return
    Array.from(this.multiNgIdsLabelIndexMap.keys()).forEach(ngId => {
      
      Array.from(this.multiNgIdsLabelIndexMap.get(ngId).keys()).forEach(idx => {
        this.nehubaViewer.hideSegment(idx, {
          name: ngId
        })
      })
      this.nehubaViewer.showSegment(0, {
        name: ngId
      })
    })
  }

  public showAllSeg(){
    if(!this.nehubaViewer) return
    this.hideAllSeg()
    Array.from(this.multiNgIdsLabelIndexMap.keys()).forEach(ngId => {
      this.nehubaViewer.hideSegment(0,{
        name: ngId
      })
    })
  }

  public showSegs(array: number[] | string[]){

    if(!this.nehubaViewer) return

    this.hideAllSeg()

    
    if (array.length === 0) return

    /**
     * TODO tobe deprecated
     */

    if (typeof array[0] === 'number') {
      console.warn(`show seg with number indices has been deprecated`)
      return
    } 

    const reduceFn:(acc:Map<string,number[]>,curr:string)=>Map<string,number[]> = (acc, curr) => {

      const newMap = new Map(acc)
      const { ngId, labelIndex } = getNgIdLabelIndexFromId({ labelIndexId: curr })
      const exist = newMap.get(ngId)
      if (!exist) newMap.set(ngId, [Number(labelIndex)])
      else newMap.set(ngId, [...exist, Number(labelIndex)])
      return newMap
    }
    
    /**
     * TODO 
     * AAAAAAARG TYPESCRIPT WHY YOU SO MAD
     */
    //@ts-ignore
    const newMap:Map<string, number[]> = array.reduce(reduceFn, new Map())
    
    /**
     * TODO
     * ugh, ugly code. cleanify
     */
    newMap.forEach((segs, ngId) => {
      this.nehubaViewer.hideSegment(0, {
        name: ngId
      })
      segs.forEach(seg => {
        this.nehubaViewer.showSegment(seg, {
          name: ngId
        })
      })
    })
  }

  private vec3(pos:[number,number,number]){
    return window['export_nehuba'].vec3.fromValues(...pos)
  }

  public setNavigationState(newViewerState:Partial<ViewerState>){

    if(!this.nehubaViewer){
      if(!PRODUCTION || window['__debug__'])
        console.warn('setNavigationState > this.nehubaViewer is not yet defined')
      return
    }

    const {
      orientation,
      perspectiveOrientation,
      perspectiveZoom,
      position,
      positionReal,
      zoom
    } = newViewerState

    if( perspectiveZoom ) 
      this.nehubaViewer.ngviewer.perspectiveNavigationState.zoomFactor.restoreState(perspectiveZoom)
    if( zoom ) 
      this.nehubaViewer.ngviewer.navigationState.zoomFactor.restoreState(zoom)
    if( perspectiveOrientation ) 
      this.nehubaViewer.ngviewer.perspectiveNavigationState.pose.orientation.restoreState( perspectiveOrientation )
    if( orientation )
      this.nehubaViewer.ngviewer.navigationState.pose.orientation.restoreState( orientation )
    if( position )
      this.nehubaViewer.setPosition( this.vec3(position) , positionReal ? true : false )
  }

  public obliqueRotateX(amount:number){
    this.nehubaViewer.ngviewer.navigationState.pose.rotateRelative(this.vec3([0, 1, 0]), -amount / 4.0 * Math.PI / 180.0)
  }

  public obliqueRotateY(amount:number){
    this.nehubaViewer.ngviewer.navigationState.pose.rotateRelative(this.vec3([1, 0, 0]), amount / 4.0 * Math.PI / 180.0)
  }

  public obliqueRotateZ(amount:number){
    this.nehubaViewer.ngviewer.navigationState.pose.rotateRelative(this.vec3([0, 0, 1]), amount / 4.0 * Math.PI / 180.0)
  }

  /**
   * 
   * @param arrayIdx label indices of the shown segment(s)
   * @param ngId segmentation layer name
   */
  private updateColorMap(arrayIdx:number[], ngId: string){
    const set = new Set(arrayIdx)
    const newColorMap = new Map(
      Array.from(this.multiNgIdColorMap.get(ngId).entries())
        .map(v=> set.has(v[0]) || set.size === 0 ? 
          v :
          [v[0],{red:255,green:255,blue:255}]) as any
    )

    this.nehubaViewer.batchAddAndUpdateSegmentColors(newColorMap,{
      name: ngId
    })
  }

  private newViewerInit(){

    /* isn't this layer specific? */
    /* TODO this is layer specific. need a way to distinguish between different segmentation layers */
    this._s2$ = this.nehubaViewer.mouseOver.segment
      .subscribe(({ segment, layer })=>{
        this.mouseOverSegment = segment
        this.mouseOverLayer = { ...layer }
      })

    if(this.initNav){
      this.setNavigationState(this.initNav)
    }

    if(this.initRegions){
      this.hideAllSeg()
      this.showSegs(this.initRegions)
    }

    if(this.initNiftiLayers.length > 0){
      this.initNiftiLayers.forEach(layer => this.loadLayer(layer))
      this.hideAllSeg()
    }

    this._s8$ = this.nehubaViewer.mouseOver.segment.subscribe(({segment: segmentId, layer, ...rest})=>{
      
      const {name = 'unnamed'} = layer
      if( segmentId && segmentId < 65500 ) {
        const map = this.multiNgIdsLabelIndexMap.get(name)
        const region = map && map.get(segmentId)
        this.mouseoverSegmentEmitter.emit({
          layer,
          segment: region,
          segmentId
        })
      }else{
        this.mouseoverSegmentEmitter.emit({
          layer,
          segment: null,
          segmentId
        })
      }
    })

    // nehubaViewer.navigationState.all emits every time a new layer is added or removed from the viewer
    this._s3$ = this.nehubaViewer.navigationState.all
      .debounceTime(300)
      .distinctUntilChanged((a, b) => {
        const {
          orientation: o1,
          perspectiveOrientation: po1,
          perspectiveZoom: pz1,
          position: p1,
          zoom: z1
        } = a
        const {
          orientation: o2,
          perspectiveOrientation: po2,
          perspectiveZoom: pz2,
          position: p2,
          zoom: z2
        } = b

        return [0,1,2,3].every(idx => o1[idx] === o2[idx]) &&
          [0,1,2,3].every(idx => po1[idx] === po2[idx]) &&
          pz1 === pz2 &&
          [0,1,2].every(idx => p1[idx] === p2[idx]) &&
          z1 === z2
      })
      .subscribe(({ orientation, perspectiveOrientation, perspectiveZoom, position, zoom })=>{
        this.viewerState = {
          orientation,
          perspectiveOrientation,
          perspectiveZoom,
          zoom,
          position,
          positionReal : false
        }
        
        this.debouncedViewerPositionChange.emit({
          orientation : Array.from(orientation),
          perspectiveOrientation : Array.from(perspectiveOrientation),
          perspectiveZoom,
          zoom,
          position,
          positionReal : true
        })
      })

    this.ondestroySubscriptions.push(
      this.nehubaViewer.mouseOver.layer
        .filter(obj => obj.layer.name === this.constantService.ngLandmarkLayerName)
        .subscribe(obj => this.mouseoverLandmarkEmitter.emit(obj.value))
    )

    this._s4$ = this.nehubaViewer.navigationState.position.inRealSpace
      .filter(v=>typeof v !== 'undefined' && v !== null)
      .subscribe(v=>this.navPosReal=v)
    this._s5$ = this.nehubaViewer.navigationState.position.inVoxels
      .filter(v=>typeof v !== 'undefined' && v !== null)
      .subscribe(v=>this.navPosVoxel=v)
    this._s6$ = this.nehubaViewer.mousePosition.inRealSpace
      .filter(v=>typeof v !== 'undefined' && v !== null)
      .subscribe(v=>(this.mousePosReal=v))
    this._s7$ = this.nehubaViewer.mousePosition.inVoxels
      .filter(v=>typeof v !== 'undefined' && v !== null)
      .subscribe(v=>(this.mousePosVoxel=v))
  }

  private loadNewParcellation(){

    /* show correct segmentation layer */
    this._baseUrls = []

    this.ngIds.map(id => {
      const newlayer = this.nehubaViewer.ngviewer.layerManager.getLayerByName(id)
      if(newlayer)newlayer.setVisible(true)
      else console.warn('could not find new layer',id)

      const regex = /^(\S.*?)\:\/\/(.*?)$/.exec(newlayer.sourceUrl)
      
      if(!regex || !regex[2]){
        console.error('could not parse baseUrl')
        return
      }
      if(regex[1] !== 'precomputed'){
        console.error('sourceUrl is not precomputed')
        return
      }
      
      const baseUrl = regex[2]
      this._baseUrls.push(baseUrl)
      this._baseUrlToParcellationIdMap.set(baseUrl, id)

      /* load meshes */
      /* TODO could be a bug where user loads new parcellation, but before the worker could completely populate the list */
      const set = this.workerService.safeMeshSet.get(baseUrl)
      if(set){
        this.nehubaViewer.setMeshesToLoad([...set],{
          name : id
        })
      }else{
        if(newlayer){
          this.zone.runOutsideAngular(() => 
            this.workerService.worker.postMessage({
              type : 'CHECK_MESHES',
              parcellationId : id,
              baseUrl,
              indices : [
                ...Array.from(this.multiNgIdsLabelIndexMap.get(id).keys()),
                ...getAuxilliaryLabelIndices()
              ]
            })
          )
        }
      }
    })

    const obj = Array.from(this.multiNgIdsLabelIndexMap.keys()).map(ngId => {
      return [
        ngId, 
        new Map(Array.from(
          [
            ...this.multiNgIdsLabelIndexMap.get(ngId).entries(),
            ...getAuxilliaryLabelIndices().map(i => {
              return [i, {}]
            })
          ]
        ).map((val:[number,any])=>([val[0],this.getRgb(val[0],val[1].rgb)])) as any)
      ]
    }) as [string, Map<number, {red:number, green: number, blue: number}>][]

    this.multiNgIdColorMap = new Map(obj)

    /* load colour maps */

    Array.from(this.multiNgIdColorMap.entries()).forEach(([ngId, map]) => {

      this.nehubaViewer.batchAddAndUpdateSegmentColors(
        map,
        { name : ngId })
    })

    this._s$.forEach(_s$=>{
      if(_s$) _s$.unsubscribe()
    })

    if(this._s1$)this._s1$.unsubscribe()
    if(this._s9$)this._s9$.unsubscribe()

    const arr = Array.from(this.multiNgIdsLabelIndexMap.keys()).map(ngId => {
      return this.nehubaViewer.getShownSegmentsObservable({
        name: ngId
      }).subscribe(arrayIdx => this.updateColorMap(arrayIdx, ngId))
    })

    this._s9$ = {
      unsubscribe: () => {
        while(arr.length > 0) {
          arr.pop().unsubscribe()
        }
      }
    }
  }

  private getRgb(labelIndex:number,rgb?:number[]):{red:number,green:number,blue:number}{
    if(typeof rgb === 'undefined' || rgb === null){
      const arr = intToColour(Number(labelIndex))
      return {
        red : arr[0],
        green: arr[1],
        blue : arr[2]
      }
    }
    return {
      red : rgb[0],
      green: rgb[1],
      blue : rgb[2]
    }
  }
}

const patchSliceViewPanel = (sliceViewPanel: any) => {
  const originalDraw = sliceViewPanel.draw
  sliceViewPanel.draw = function (this) {
    
    if(this.sliceView){
      const viewportToDataEv = new CustomEvent('viewportToData', {
        bubbles: true,
        detail: {
          viewportToData : this.sliceView.viewportToData
        }
      })
      this.element.dispatchEvent(viewportToDataEv)
    }

    originalDraw.call(this)
  }
}

/**
 * 
 * https://stackoverflow.com/a/16348977/6059235
 */
const intToColour = function(int) {
  if(int >= 65500){
    return [255,255,255]
  }
  const str = String(int*65535)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const returnV = []
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    returnV.push(value)
  }
  return returnV
}

export interface ViewerState{
  orientation : [number,number,number,number]
  perspectiveOrientation : [number,number,number,number]
  perspectiveZoom : number
  position : [number,number,number]
  positionReal : boolean
  zoom : number
}

export function getAuxilliaryLabelIndices(){
  return [65535]
  // return Array.from(Array(36)).map((_,i)=>65500+i)
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
export const ICOSAHEDRON_VTK_URL = URL.createObjectURL( new Blob([ _encoder.encode(ICOSAHEDRON) ],{type : 'application/octet-stream'} ))

export const FRAGMENT_MAIN_WHITE = `void main(){emitRGB(vec3(1.0,1.0,1.0));}`
export const FRAGMENT_EMIT_WHITE = `emitRGB(vec3(1.0, 1.0, 1.0));`
export const FRAGMENT_EMIT_RED = `emitRGB(vec3(1.0, 0.1, 0.12));`
export const computeDistance = (pt1:[number, number], pt2:[number,number]) => ((pt1[0] - pt2[0]) ** 2 + (pt1[1] - pt2[1]) ** 2) ** 0.5