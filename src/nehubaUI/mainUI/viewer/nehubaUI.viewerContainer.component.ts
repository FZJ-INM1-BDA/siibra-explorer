import { Component,ViewChild,Input,AfterViewInit } from '@angular/core'
import { UI_CONTROL,EXTERNAL_CONTROL as gExternalControl, VIEWER_CONTROL, MainController, LandmarkServices, SpatialSearch } from 'nehubaUI/nehubaUI.services'
import { NehubaViewerInnerContainer } from './nehubaUI.viewer.component'
import { Subject } from 'rxjs/Subject';
import { RegionDescriptor } from 'nehubaUI/nehuba.model';

import template from './nehubaUI.viewerContainer.template.html'

@Component({
  selector : 'ATLASViewer',
  template : template,
  providers : [ SpatialSearch ]
})

export class NehubaViewerContainer implements AfterViewInit {
  darktheme : boolean
  @Input() hideUI : boolean = false
  @ViewChild(NehubaViewerInnerContainer) nehubaViewerInnerContainer : NehubaViewerInnerContainer

  constructor(public mainController:MainController,private landmarkServices:LandmarkServices){ }

  mouseEventHandler : (mode:string,ev:any)=>void = (mode:string,ev:any) => {
    if(VIEWER_CONTROL.mouseEvent)VIEWER_CONTROL.mouseEvent.next({eventName:mode,event:ev})
  }

  ngAfterViewInit(){
    UI_CONTROL.afterTemplateSelection(()=>
      this.darktheme = gExternalControl.metadata.selectedTemplate ? gExternalControl.metadata.selectedTemplate.useTheme == 'dark' : false)
    VIEWER_CONTROL.mouseEvent = new Subject()
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
