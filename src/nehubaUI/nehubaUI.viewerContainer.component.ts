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
        <span id="helpbutton" (click)="showhelp()" [ngClass]="{darktheme : darktheme}" class = "glyphicon glyphicon-question-sign unicodeSymbols"></span>
        <span id="hideUI" (click)="toggleHideUI()" [ngClass]="{darktheme : darktheme,'glyphicon-resize-full':!hideUI,'glyphicon-resize-small':hideUI}" class = "glyphicon unicodeSymbols"></span>
    `
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