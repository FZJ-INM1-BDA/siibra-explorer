import { Component,ViewChild,Input,AfterViewInit } from '@angular/core'
import { UI_CONTROL,EXTERNAL_CONTROL as gExternalControl, VIEWER_CONTROL } from './nehubaUI.services'
import { NehubaViewerInnerContainer } from './nehubaUI.viewer.component'
import { Subject } from 'rxjs/Subject';

@Component({
  selector : 'ATLASViewer',
  template : `
    <NehubaViewer 
      (mousemove)="mouseEventHandler('mousemove',$event)"
      (click) = "mouseEventHandler('click',$event)"
      (mousedown) = "mouseEventHandler('mousedown',$event)"
      (mouseup) = "mouseEventHandler('mouseup',$event)"></NehubaViewer>
  `
})

export class NehubaViewerContainer implements AfterViewInit {
  darktheme : boolean
  @Input() hideUI : boolean = false
  @ViewChild(NehubaViewerInnerContainer) nehubaViewerInnerContainer : NehubaViewerInnerContainer

  constructor(){ }

  mouseEventHandler : (mode:string,ev:any)=>void = (mode:string,ev:any) => {
    if(VIEWER_CONTROL.mouseEvent)VIEWER_CONTROL.mouseEvent.next({eventName:mode,event:ev})
  }

  ngAfterViewInit(){
    UI_CONTROL.afterTemplateSelection(()=>
      this.darktheme = gExternalControl.metadata.selectedTemplate ? gExternalControl.metadata.selectedTemplate.useTheme == 'dark' : false)
    VIEWER_CONTROL.mouseEvent = new Subject()
  }

}