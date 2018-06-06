import { Component, AfterViewInit, OnDestroy } from "@angular/core";
import * as export_nehuba from 'export_nehuba'

import 'export_nehuba/dist/min/chunk_worker.bundle.js'
import { Observable, Observer } from "rxjs";
import { takeUntil } from 'rxjs/operators'

@Component({
  templateUrl : './nehubaViewer.template.html',
  styleUrls : [
    './nehubaViewer.style.css'
  ]
})

export class NehubaViewerUnit implements AfterViewInit,OnDestroy{
  config : any
  nehubaViewer : any

  parcellationId : string
  regionsLabelIndexMap : Map<number,any>
  shownSegment$ : any
  mouseoverSegment$ : any

  private defaultColormap : Map<number,{red:number,green:number,blue:number}>
  public mouseOverSegment : number | null

  ngAfterViewInit(){
    this.nehubaViewer = export_nehuba.createNehubaViewer(this.config,console.warn)
    
    if(this.regionsLabelIndexMap){
      this.loadNewParcellation()
    }
  }
  ngOnDestroy(){
    this.nehubaViewer.dispose()
    this.shownSegment$.unsubscribe()
    this.mouseoverSegment$.unsubscribe()
  }

  public hideAllSeg(){
    this.showAllSeg()
    this.nehubaViewer.showSegment(0,{
      name : this.parcellationId
    })
  }

  public showAllSeg(){
    Array.from(this.regionsLabelIndexMap.keys()).forEach(idx=>
      this.nehubaViewer.hideSegment(idx,{
        name : this.parcellationId
      }))
  }

  public showSegs(array:number[]){
    this.showAllSeg()
    array.forEach(idx=>
      this.nehubaViewer.showSegment(idx,{
        name : this.parcellationId
      }))
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
      ]
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

    if(this.shownSegment$) this.shownSegment$.unsubscribe()
    if(this.mouseoverSegment$) this.mouseoverSegment$.unsubscribe()
    this.shownSegment$ = this.nehubaViewer.getShownSegmentsObservable({
      name : this.parcellationId
    }).subscribe(arrayIdx=>this.updateColorMap(arrayIdx))
    this.mouseoverSegment$ = this.nehubaViewer.mouseOver.segment
      .subscribe(obj=>this.mouseOverSegment = obj.segment)
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