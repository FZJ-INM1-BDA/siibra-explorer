import { Component,ViewChild,Input } from '@angular/core'
import { MainController, LandmarkServices, SpatialSearch } from 'nehubaUI/nehubaUI.services'
import { NehubaViewerInnerContainer } from './nehubaUI.viewer.component'
import { Subject } from 'rxjs/Subject';
import { RegionDescriptor } from 'nehubaUI/nehuba.model';

import template from './nehubaUI.viewerContainer.template.html'
import { INTERACTIVE_VIEWER } from 'nehubaUI/exports';

@Component({
  selector : 'ATLASViewer',
  template : template,
  providers : [ SpatialSearch ]
})

export class NehubaViewerContainer {
  darktheme : boolean
  @Input() hideUI : boolean = false
  @ViewChild(NehubaViewerInnerContainer) nehubaViewerInnerContainer : NehubaViewerInnerContainer

  /* TODO to be exported as viewerHandle.mouseEvent */
  mouseEventOnViewer : Subject<any> = new Subject()

  constructor(public mainController:MainController,private landmarkServices:LandmarkServices){
    INTERACTIVE_VIEWER.viewerHandle.moveToNavigationLoc = (loc,real)=>(this.checkViewerExist(),this.nehubaViewerInnerContainer.moveToNavigationLoc(loc,real))
    INTERACTIVE_VIEWER.viewerHandle.moveToNavigationOri = (ori) =>(this.checkViewerExist(),this.nehubaViewerInnerContainer.moveToNavigationOri(ori))
    
    INTERACTIVE_VIEWER.viewerHandle.setNavigationLoc = (loc,real) => (this.checkViewerExist(),this.nehubaViewerInnerContainer.setNavigationLoc(loc,real))
    INTERACTIVE_VIEWER.viewerHandle.setNavigationOri = (ori) => (this.checkViewerExist(),this.nehubaViewerInnerContainer.setNavigationOrientation(ori))
    
    INTERACTIVE_VIEWER.viewerHandle.hideSegment = (labelIndex) =>(this.checkViewerExist(),this.nehubaViewerInnerContainer.hideSegment(labelIndex))
    INTERACTIVE_VIEWER.viewerHandle.hideAllSegments = () => (this.checkViewerExist(),this.nehubaViewerInnerContainer.hideAllSegments())
    INTERACTIVE_VIEWER.viewerHandle.showSegment = (labelIndex) => (this.checkViewerExist(),this.nehubaViewerInnerContainer.showSegment(labelIndex))
    INTERACTIVE_VIEWER.viewerHandle.showAllSegments = () => (this.checkViewerExist(),this.nehubaViewerInnerContainer.showAllSegments())
    INTERACTIVE_VIEWER.viewerHandle.loadLayer = (layerObj) => (this.checkViewerExist(),this.nehubaViewerInnerContainer.loadLayer(layerObj))
    INTERACTIVE_VIEWER.viewerHandle.removeLayer = (layerObj) => (this.checkViewerExist(),this.nehubaViewerInnerContainer.removeLayer(layerObj))
    INTERACTIVE_VIEWER.viewerHandle.setLayerVisibility = (layerObj,visible) => (this.checkViewerExist(),this.nehubaViewerInnerContainer.setLayerVisibility(layerObj,visible))

    INTERACTIVE_VIEWER.viewerHandle.mouseEvent = this.mouseEventOnViewer
  }

  checkViewerExist = () => {
    if(this.nehubaViewerInnerContainer.nehubaViewerComponent !== null && (typeof this.nehubaViewerInnerContainer.nehubaViewerComponent != 'undefined'))return
    else throw new Error('nehuba viewer has not yet been initialised, probably because a template has not yet been loaded.')
  }

  mouseEventHandler : (mode:string,ev:any)=>void = (mode:string,ev:any) => {
    this.mouseEventOnViewer.next({eventName:mode,event:ev})
  }

  receptorMouseEnter(region:RegionDescriptor){

    const idx = this.landmarkServices.landmarks.findIndex(l=>l.id==region.name)
    if(idx >= 0) {
      this.landmarkServices.landmarks[idx].hover = true
      this.landmarkServices.TEMP_vtkHighlight(idx)
    }
  }

  receptorMouseLeave(region:RegionDescriptor){
    const idx = this.landmarkServices.landmarks.findIndex(l=>l.id==region.name)
    if(idx >= 0) {
      this.landmarkServices.landmarks[idx].hover = false
      this.landmarkServices.TEMP_clearVtkHighlight(idx)
    }
  }
}

// export let MOVE_TO_LOC : (loc:[number,number,number],realSpace?:boolean) => void