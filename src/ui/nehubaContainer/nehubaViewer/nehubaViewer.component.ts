import { Component, AfterViewInit, OnDestroy } from "@angular/core";
import * as export_nehuba from 'export_nehuba'

import 'export_nehuba/dist/min/chunk_worker.bundle.js'
import { Observable,Subject, Subscription } from 'rxjs'
import { combineLatest } from 'rxjs/operators'

@Component({
  templateUrl : './nehubaViewer.template.html',
  styleUrls : [
    './nehubaViewer.style.css'
  ]
})

export class NehubaViewerUnit implements AfterViewInit,OnDestroy{
  config : any
  nehubaViewer : any

  _s1$ : any
  _s2$ : any
  _s3$ : any
  _s4$ : any
  _s5$ : any
  _s6$ : any
  _s7$ : any

  _s$ : any[] = [
    this._s1$,
    this._s2$,
    this._s3$,
    this._s4$,
    this._s5$,
    this._s6$,
    this._s7$
  ]

  parcellationId : string
  regionsLabelIndexMap : Map<number,any>

  navPosReal : [number,number,number] = [0,0,0]
  navPosVoxel : [number,number,number] = [0,0,0]

  mousePosReal : [number,number,number] = [0,0,0]
  mousePosVoxel : [number,number,number] = [0,0,0]

  viewerState : ViewerState

  private defaultColormap : Map<number,{red:number,green:number,blue:number}>
  public mouseOverSegment : number | null

  ngAfterViewInit(){
    this.nehubaViewer = export_nehuba.createNehubaViewer(this.config,console.warn)
    
    if(this.regionsLabelIndexMap){
      this.loadNewParcellation()
    }

    window['nehubaViewer'] = this.nehubaViewer
  }
  ngOnDestroy(){
    this._s$.forEach(_s$=>{
      if(_s$) _s$.unsubscribe()
    })
  }

  public hideAllSeg(){
    Array.from(this.regionsLabelIndexMap.keys()).forEach(idx=>
      this.nehubaViewer.hideSegment(idx,{
        name : this.parcellationId
      }))
    this.nehubaViewer.showSegment(0,{
      name : this.parcellationId
    })
  }

  public showAllSeg(){
    this.hideAllSeg()
    this.nehubaViewer.hideSegment(0,{
      name : this.parcellationId
    })
  }

  public showSegs(array:number[]){
    this.hideAllSeg()

    this.nehubaViewer.hideSegment(0,{
      name : this.parcellationId
    })

    array.forEach(idx=>
      this.nehubaViewer.showSegment(idx,{
        name : this.parcellationId
      }))
  }

  public setNavigationState(newViewerState:Partial<ViewerState>){
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
      this.nehubaViewer.setPosition( position , positionReal ? true : false )
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

  private loadNewParcellation(){
    this.nehubaViewer.setMeshesToLoad(
      [
        ...Array.from(this.regionsLabelIndexMap.keys()),
        ...[65535]
      ],
      {
        name : this.parcellationId
      }
    )

    this.defaultColormap = new Map(
      Array.from(
        [
          ...this.regionsLabelIndexMap.entries(),
          ...[[65535,{}]]
        ]
      ).map(val=>([val[0],this.getRgb(val[1].rgb)])) as any)
    
    this.nehubaViewer.batchAddAndUpdateSegmentColors(
      this.defaultColormap,
      { name : this.parcellationId })

    this._s$.forEach(_s$=>{
      if(_s$) _s$.unsubscribe()
    })

    this._s1$ = this.nehubaViewer.getShownSegmentsObservable({
      name : this.parcellationId
    }).subscribe(arrayIdx=>this.updateColorMap(arrayIdx))

    this._s2$ = this.nehubaViewer.mouseOver.segment
      .subscribe(obj=>this.mouseOverSegment = obj.segment)
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

  private getRgb(rgb?:number[]):{red:number,green:number,blue:number}{
    if(typeof rgb === 'undefined' || rgb === null)
      return {
        red : 255,
        green: 255,
        blue : 255
      }
    return {
      red : rgb[0],
      green: rgb[1],
      blue : rgb[2]
    }
  }
}

export interface ViewerState{
  orientation : [number,number,number,number]
  perspectiveOrientation : [number,number,number,number]
  perspectiveZoom : number
  position : [number,number,number]
  positionReal : boolean
  zoom : number
}
