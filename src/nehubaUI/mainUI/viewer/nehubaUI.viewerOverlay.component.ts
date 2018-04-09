import { Component, Input, ViewChild, TemplateRef, OnDestroy } from "@angular/core";
import { Landmark } from "nehubaUI/nehuba.model";
import { InfoToUIService, MainController, SpatialSearch, LandmarkServices } from "nehubaUI/nehubaUI.services";
import { Subject } from 'rxjs/Rx'

import template from './nehubaUI.viewerOverlay.template.html'

@Component({
  selector : `nehubaui-overlay`,
  template : template,
  styles :[
    `
    nehuba-viewer-2d-landmark-unit
    {
      position : absolute;
    }
    
    [floatingPopoverContent]
    {
      padding: 0.5em 1em;
      white-space:nowrap;
    }
    `
  ]
})

export class NehubaViewerOverlayUnit implements OnDestroy{
  @Input() nanometersToOffsetPixelsFn : Function 
  @Input() rotate3D : number[] | undefined
  @ViewChild('landmarkTemplateRef',{read:TemplateRef}) landmarkTemplateRef : TemplateRef<any>
  hoverLandmark : Landmark | null
  constructor(
    public infoToUI:InfoToUIService,
    public mainController:MainController,
    public spatialSearch:SpatialSearch,
    public landmarkServices:LandmarkServices){
    
    this.infoToUI.getContentInfoPopoverObservable(
      this.mouseoverLandmarkObservable
        .map(ev=> ev ? this.landmarkTemplateRef : null)
        .takeUntil(this.onDestroySubject)
    )
  }

  onDestroySubject : Subject<any> = new Subject()

  ngOnDestroy(){
    this.onDestroySubject.next()
    this.onDestroySubject.complete()
  }

  private _zOffset : number = 0

  set zOffset(n:number){
    this._zOffset = n
  }

  get zOffset(){
    return this._zOffset
  }

  mouseoverLandmarkObservable : Subject<Landmark|null> = new Subject()

  mouseoverLandmark(landmark:Landmark|null){
    this.mouseoverLandmarkObservable.next(landmark ? landmark : null)
    this.hoverLandmark = landmark
  }

  pos(landmark:Landmark){
    if(this.nanometersToOffsetPixelsFn){
      const vec = this.nanometersToOffsetPixelsFn(landmark.pos.map((pt:number)=>pt*1000000) as any)
      this.zOffset = vec[2]
      
      return ({
        'transform':`translate(${vec[0]}px, ${vec[1]}px)`,
        'text-shadow' : `
          -1px 0 rgba(0,0,0,1.0),
          0 1px rgba(0,0,0,1.0),
          1px 0 rgba(0,0,0,1.0),
          0 -1px rgba(0,0,0,1.0)`
      })

      // return vec[2] >= 0 ? 
      // ({
      //   'z-index':`${Math.round(vec[1]*10)}`,
      //   'transform':`translate(${vec[0]}px, ${vec[1]}px)`,
      //   // 'height': `${vec[2]}px`,
      //   'text-shadow' : `
      //     -1px 0 rgba(0,0,0,1.0),
      //     0 1px rgba(0,0,0,1.0),
      //     1px 0 rgba(0,0,0,1.0),
      //     0 -1px rgba(0,0,0,1.0)`
      // }) : ({
      //   'z-index':`${Math.round(vec[2])}`,
      //   'transform' : `translate(${vec[0]}px, ${vec[1]}px)`,
      //   'text-shadow' : `
      //     -1px 0 rgba(0,0,0,1.0),
      //     0 1px rgba(0,0,0,1.0),
      //     1px 0 rgba(0,0,0,1.0),
      //     0 -1px rgba(0,0,0,1.0)`
      // })
    }else{
      return({
        display:`none`
      })
    }
  }

  stylePerspectiveAd(){
    return({
      'transform':`rotate3d(${this.rotate3D![1]},${this.rotate3D![2]},${this.rotate3D![3]},${this.rotate3D![0]}rad)`
    })
  }
}
