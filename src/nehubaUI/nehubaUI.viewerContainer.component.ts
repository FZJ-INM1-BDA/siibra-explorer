import { Component,ViewChild,Input,EventEmitter,Output,AfterViewInit } from '@angular/core'
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
    <span glyphiconToggleUI (click)="toggleHideUI()" [ngClass]="{darktheme : darktheme,'glyphicon-resize-full':!hideUI,'glyphicon-resize-small':hideUI}" class = "glyphicon"></span>
  `,
  styles : [
    `
    div#container
    {
      position:absolute;
      
      z-index:9;
    }

    span[glyphiconShowHelp],
    span[glyphiconToggleUI]
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

    span[glyphiconToggleUI]
    {
      right:1.6em;
      top:0.3em;
    }
    `
  ]
})

export class NehubaViewerContainer implements AfterViewInit {
  darktheme : boolean
  @Input() hideUI : boolean = false
  @Output() emitHideUI : EventEmitter<any> = new EventEmitter()
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


  toggleHideUI(){
    this.emitHideUI.emit({hideUI:!this.hideUI})
    if( this.nehubaViewerInnerContainer && this.nehubaViewerInnerContainer.nehubaViewerComponent ){
      this.nehubaViewerInnerContainer.nehubaViewerComponent.nehubaViewer.redraw()
    }
  }

  showhelp(){
    const modalHandler = <ModalHandler>UI_CONTROL.modalControl.getModalHandler()
    modalHandler.title = `<h4>Help</h4>`
    modalHandler.body = HELP_MENU
    modalHandler.footer
    modalHandler.show()
  }
}