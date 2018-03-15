import { Component,ViewChild,Input,AfterViewInit } from '@angular/core'
import { UI_CONTROL,EXTERNAL_CONTROL as gExternalControl, VIEWER_CONTROL, MainController, LandmarkServices } from './nehubaUI.services'
import { NehubaViewerInnerContainer } from './nehubaUI.viewer.component'
import { Subject } from 'rxjs/Subject';
import { RegionDescriptor } from 'nehubaUI/nehuba.model';

@Component({
  selector : 'ATLASViewer',
  template : `
    <NehubaViewer 
      (mousemove)="mouseEventHandler('mousemove',$event)"
      (click) = "mouseEventHandler('click',$event)"
      (mousedown) = "mouseEventHandler('mousedown',$event)"
      (mouseup) = "mouseEventHandler('mouseup',$event)"></NehubaViewer>

    <div *ngIf = "mainController.selectedTemplate">
      <nehubaui-searchresult-region-list 
        [title] = "'Receptor Data Browser'"
        (mouseEnterRegion)="receptorMouseEnter($event)"
        (mouseLeaveRegion)="receptorMouseLeave($event)"
        [regions] = " Array.from( mainController.regionsLabelIndexMap.values() ).filter(filterForReceptorData) "
        *ngIf = "mainController.viewingMode == 'Receptor Data'">
      </nehubaui-searchresult-region-list>
      
      <nehubaui-searchresult-region-pill-list 
        [startingMode] = "'docked'"
        [title] = "'Selected Regions'"
        [regions] = " mainController.selectedRegions "
        *ngIf = "mainController.viewingMode == 'navigation (default mode)' && mainController.selectedRegions.length > 0">
      </nehubaui-searchresult-region-pill-list>

      <nehubaui-searchresult-region-pill-list 
        [additionalContent] = "'nifti'"
        [startingMode] = "'docked'"
        [title] = "'Probabilistic Cytoarchitectonic Maps'"
        [regions] = " mainController.selectedRegions "
        *ngIf = "mainController.viewingMode == 'Probability Map' && mainController.selectedRegions.length > 0">
      </nehubaui-searchresult-region-pill-list>
    </div>
  `
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

  /* Variables needed for listify receptor browser */
  Array = Array
  filterForReceptorData = (region:RegionDescriptor) => region.moreInfo.some(info=>info.name=='Receptor Data')

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

/* interface required for region template refs to display */
export interface RegionTemplateRefInterface{
  region : RegionDescriptor
}