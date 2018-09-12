import { Component, AfterViewInit, OnDestroy, Output, EventEmitter, ElementRef } from "@angular/core";
import * as export_nehuba from 'third_party/export_nehuba/main.bundle.js'

import 'third_party/export_nehuba/chunk_worker.bundle.js'
import { getActiveColorMapFragmentMain } from "../nehubaContainer.component";

@Component({
  templateUrl : './nehubaViewer.template.html',
  styleUrls : [
    './nehubaViewer.style.css'
  ]
})

export class NehubaViewerUnit implements AfterViewInit,OnDestroy{
  
  @Output() debouncedViewerPositionChange : EventEmitter<any> = new EventEmitter()
  @Output() mouseoverSegmentEmitter : EventEmitter<any | number | null> = new EventEmitter()
  @Output() regionSelectionEmitter : EventEmitter<any> = new EventEmitter()

  /* only used to set initial navigation state */
  initNav : any
  initRegions : any[]
  initNiftiLayers : any[] = []

  /* deprecated */
  initDedicatedView : string[]

  config : any
  
  nehubaViewer : any

  _s1$ : any
  _s2$ : any
  _s3$ : any
  _s4$ : any
  _s5$ : any
  _s6$ : any
  _s7$ : any
  _s8$ : any

  _s$ : any[] = [
    this._s1$,
    this._s2$,
    this._s3$,
    this._s4$,
    this._s5$,
    this._s6$,
    this._s7$,
    this._s8$
  ]

  constructor(public elementRef:ElementRef){
    this.patchNG()
  }

  private _parcellationId : string

  get parcellationId(){
    return this._parcellationId
  }

  set parcellationId(id:string){

    if(this._parcellationId && this.nehubaViewer){
      const oldlayer = this.nehubaViewer.ngviewer.layerManager.getLayerByName(this._parcellationId)
      if(oldlayer)oldlayer.setVisible(false)
      else console.warn('could not find old layer',this.parcellationId)
    }

    this._parcellationId = id
    
    if(this.nehubaViewer)
      this.loadNewParcellation()
  }

  regionsLabelIndexMap : Map<number,any>

  navPosReal : [number,number,number] = [0,0,0]
  navPosVoxel : [number,number,number] = [0,0,0]

  mousePosReal : [number,number,number] = [0,0,0]
  mousePosVoxel : [number,number,number] = [0,0,0]

  viewerState : ViewerState

  private defaultColormap : Map<number,{red:number,green:number,blue:number}>
  public mouseOverSegment : number | null

  ngAfterViewInit(){
    this.nehubaViewer = export_nehuba.createNehubaViewer(this.config, (err)=>{
      /* print in debug mode */
      console.log('xgui3783', err)
    });
    
    if(this.regionsLabelIndexMap){
      const managedLayers = this.nehubaViewer.ngviewer.layerManager.managedLayers
      managedLayers.slice(1).forEach(layer=>layer.setVisible(false))
      this.nehubaViewer.redraw()
    }

    this.newViewerInit()
    this.loadNewParcellation()

    window['nehubaViewer'] = this.nehubaViewer
  }
  ngOnDestroy(){
    this._s$.forEach(_s$=>{
      if(_s$) _s$.unsubscribe()
    })
    this.nehubaViewer.dispose()
  }

  private patchNG(){

    const { LayerManager, UrlHashBinding } = export_nehuba.getNgPatchableObj()
    
    UrlHashBinding.prototype.setUrlHash = () => {
      // console.log('seturl hash')
      // console.log('setting url hash')
    }

    UrlHashBinding.prototype.updateFromUrlHash = () => {
      // console.log('update hash binding')
    }
    
    /* TODO find a more permanent fix to disable double click */
    LayerManager.prototype.invokeAction = (arg) => {
      const region = this.regionsLabelIndexMap.get(this.mouseOverSegment)
      if (arg === 'select' && region) {
        this.regionSelectionEmitter.emit(region)
      }
    }
  }

  private filterLayers(l:any,layerObj:any):boolean{
    return Object.keys(layerObj).length == 0 && layerObj.constructor == Object ?
      true :
      Object.keys(layerObj).every(key=>
        !(<Object>l).hasOwnProperty(key) ? 
          false :
          layerObj[key] instanceof RegExp ?
            layerObj[key].test(l[key]) :
            layerObj[key] == l[key])
  }

  public addUserLandmarks(landmarks:any[]){
    if(!this.nehubaViewer)
      return
    const _ = {}
    landmarks.forEach(lm => {
      _[`user-${lm.id}`] = {
        type : 'mesh',
        source : `vtk://${ICOSAHEDRON_VTK_URL}`,
        transform : [
          [2 ,0 ,0 , lm.position[0]*1e6],
          [0 ,2 ,0 , lm.position[1]*1e6],
          [0 ,0 ,2 , lm.position[2]*1e6],
          [0 ,0 ,0 , 1 ],
        ],
        shader : FRAGMENT_MAIN_WHITE
      }
    })

    this.loadLayer(_)
  }

  public removeUserLandmarks(){
    if(!this.nehubaViewer)
      return
    this.removeLayer({
      name : /^user\-/
    })
  }

  public removeSpatialSearch3DLandmarks(){
    this.removeLayer({
      name : /vtk-[0-9]/
    })
  }

  public addSpatialSearch3DLandmarks(poss:[number,number,number][],scale?:number,type?:'icosahedron'){
    const _ = {}
    poss.forEach((pos,idx)=>{

      _[`vtk-${idx}`] = {
        type : 'mesh',
        source : `vtk://${ICOSAHEDRON_VTK_URL}`,
        transform : [
          [2 ,0 ,0 , pos[0]*1e6],
          [0 ,2 ,0 , pos[1]*1e6],
          [0 ,0 ,2 , pos[2]*1e6],
          [0 ,0 ,0 , 1 ],
        ],
        shader : FRAGMENT_MAIN_WHITE
      }
    })
    /* load layer triggers navigation view event, results in infinite loop */
    this.loadLayer(_)
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
    Array.from(this.regionsLabelIndexMap.keys()).forEach(idx=>
      this.nehubaViewer.hideSegment(idx,{
        name : this.parcellationId
      }))
    this.nehubaViewer.showSegment(0,{
      name : this.parcellationId
    })
  }

  public showAllSeg(){
    if(!this.nehubaViewer) return
    this.hideAllSeg()
    this.nehubaViewer.hideSegment(0,{
      name : this.parcellationId
    })
  }

  public showSegs(array:number[]){
    if(!this.nehubaViewer) return
    this.hideAllSeg()

    this.nehubaViewer.hideSegment(0,{
      name : this.parcellationId
    })

    array.forEach(idx=>
      this.nehubaViewer.showSegment(idx,{
        name : this.parcellationId
      }))
  }

  private vec3(pos:[number,number,number]){
    return export_nehuba.vec3.fromValues(...pos)
  }

  public setNavigationState(newViewerState:Partial<ViewerState>){

    if(!this.nehubaViewer){
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

  private updateColorMap(arrayIdx:number[]){
    const set = new Set(arrayIdx)
    const newColorMap = new Map(
      Array.from(this.defaultColormap.entries())
        .map(v=> set.has(v[0]) || set.size === 0 ? 
          v :
          [v[0],{red:255,green:255,blue:255}]) as any
    )

    this.nehubaViewer.batchAddAndUpdateSegmentColors(newColorMap,{
      name:this.parcellationId
    })
  }

  private newViewerInit(){

    /* isn't this segment specific? */
    this._s2$ = this.nehubaViewer.mouseOver.segment
      .subscribe(obj=>this.mouseOverSegment = obj.segment)

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

    /* dedicated view is deprecated */
    if(this.initDedicatedView){
      this.hideAllSeg()
      const _ = {}
      
      this.initDedicatedView.forEach((layer,index) => {
        _[`dedicatedview-${index}`] = {
          type : 'image',
          source : layer,
          shader : getActiveColorMapFragmentMain()
        }
      })
      
      this.loadLayer(_)
    }

    this._s8$ = this.nehubaViewer.mouseOver.segment.subscribe(({segment})=>{
      if( segment && segment < 65500 ) {
        const region = this.regionsLabelIndexMap.get(segment)
        this.mouseoverSegmentEmitter.emit(region ? region : segment)
      }else{
        this.mouseoverSegmentEmitter.emit(null)
      }
    })

    this._s3$ = this.nehubaViewer.navigationState.all
      .debounceTime(300)
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

    const newlayer = this.nehubaViewer.ngviewer.layerManager.getLayerByName(this.parcellationId)
    if(newlayer)newlayer.setVisible(true)
    else console.warn('could not find new layer',this.parcellationId)

    /* load meshes */
    this.nehubaViewer.setMeshesToLoad(
      [
        ...Array.from(this.regionsLabelIndexMap.keys()),
        ...getAuxilliaryLabelIndices()
      ],
      {
        name : this.parcellationId
      }
    )

    this.defaultColormap = new Map(
      Array.from(
        [
          ...this.regionsLabelIndexMap.entries(),
          ...getAuxilliaryLabelIndices().map(i=>([
              i, {}
            ]))
          
        ]
      ).map((val:[number,any])=>([val[0],this.getRgb(val[0],val[1].rgb)])) as any)

    /* load colour maps */
    this.nehubaViewer.batchAddAndUpdateSegmentColors(
      this.defaultColormap,
      { name : this.parcellationId })

    this._s$.forEach(_s$=>{
      if(_s$) _s$.unsubscribe()
    })

    if(this._s1$)this._s1$.unsubscribe()
    this._s1$ = this.nehubaViewer.getShownSegmentsObservable({
      name : this.parcellationId
    }).subscribe(arrayIdx=>this.updateColorMap(arrayIdx))

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