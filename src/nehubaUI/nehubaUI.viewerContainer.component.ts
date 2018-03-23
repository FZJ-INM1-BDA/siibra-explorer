import { Component,ViewChild,Input,AfterViewInit } from '@angular/core'
import { UI_CONTROL,EXTERNAL_CONTROL as gExternalControl, VIEWER_CONTROL, MainController, LandmarkServices, SpatialSearch } from './nehubaUI.services'
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
        [regions] = " mainController.selectedRegions "
        *ngIf = "mainController.viewingMode == 'Receptor Data'">

        <readmoreComponent
          *ngIf="mainController.selectedTemplate[mainController.viewingMode]"
          [style.background-color]="'rgba(0,0,0,0.2)'">
          <datasetBlurb
            [dataset]="mainController.selectedTemplate[mainController.viewingMode]">
          </datasetBlurb>
        </readmoreComponent>

      </nehubaui-searchresult-region-list>
      
      <nehubaui-searchresult-region-pill-list 
        [startingMode] = "'docked'"
        [title] = "'Selected Regions'"
        [regions] = " mainController.selectedRegions "
        *ngIf = "mainController.viewingMode == 'Select atlas regions'">
        
        <readmoreComponent
          *ngIf="mainController.selectedTemplate[mainController.viewingMode]"
          [style.background-color]="'rgba(0,0,0,0.2)'">
          <datasetBlurb
            [dataset]="mainController.selectedTemplate[mainController.viewingMode]">
          </datasetBlurb>
        </readmoreComponent>

      </nehubaui-searchresult-region-pill-list>

      <nehubaui-searchresult-region-pill-list 
        [additionalContent] = "'nifti'"
        [startingMode] = "'docked'"
        [title] = "'Cytoarchitectonic Probabilistic Map'"
        [regions] = " mainController.selectedRegions "
        *ngIf = "mainController.viewingMode == 'Cytoarchitectonic Probabilistic Map'">
        
        
        <readmoreComponent
          *ngIf="mainController.selectedTemplate[mainController.viewingMode]"
          [style.background-color]="'rgba(0,0,0,0.2)'">
          <datasetBlurb
            [dataset]="mainController.selectedTemplate[mainController.viewingMode]">
          </datasetBlurb>
        </readmoreComponent>
        
      </nehubaui-searchresult-region-pill-list>

      <nehubaui-landmark-list 
        *ngIf = "mainController.viewingMode == 'iEEG Recordings'">

        <readmoreComponent
          *ngIf="mainController.selectedTemplate[mainController.viewingMode]"
          [style.background-color]="'rgba(0,0,0,0.2)'">
          <datasetBlurb
            [dataset]="mainController.selectedTemplate[mainController.viewingMode]">
          </datasetBlurb>
        </readmoreComponent>
      </nehubaui-landmark-list>
      
    </div>
  `,
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

/* interface required for region template refs to display */
export interface RegionTemplateRefInterface{
  region : RegionDescriptor
}