import { Component,ViewChild,Input,AfterViewInit } from '@angular/core'
import { UI_CONTROL,EXTERNAL_CONTROL as gExternalControl,HELP_MENU, VIEWER_CONTROL } from './nehubaUI.services'
import { NehubaViewerInnerContainer } from './nehubaUI.viewer.component'
import { ModalHandler } from './nehubaUI.modal.component'
import { Subject } from 'rxjs/Subject';

@Component({
  selector : 'ATLASViewer',
  template : `
    <NehubaViewer 
      (mousemove)="mouseEventHandler('mousemove',$event)"
      (click) = "mouseEventHandler('click',$event)"
      (mousedown) = "mouseEventHandler('mousedown',$event)"
      (mouseup) = "mouseEventHandler('mouseup',$event)"></NehubaViewer>
    <span glyphiconShowHelp (click)="showhelp()" [ngClass]="{darktheme : darktheme}" class = "glyphicon glyphicon-question-sign"></span>
  `,
  styles : [
    `
    div#container
    {
      position:absolute;
      
      z-index:9;
    }

    span[glyphiconShowHelp]
    {
      position:absolute;
      z-index:10;
      font-size:1.5em;
    }
    
    span[glyphiconShowHelp]
    {
      right:0.3em;
      top:0.3em;
    }
    `
  ]
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

  showhelp(){
    const modalHandler = <ModalHandler>UI_CONTROL.modalControl.getModalHandler()
    modalHandler.title = `<h4>Help</h4>`
    modalHandler.body = HELP_MENU
    modalHandler.footer
    modalHandler.show()
  }
}