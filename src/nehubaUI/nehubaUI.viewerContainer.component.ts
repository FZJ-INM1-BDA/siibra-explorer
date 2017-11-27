import { Component,ViewChild,Input,EventEmitter,Output } from '@angular/core'
import { EventCenter,EVENTCENTER_CONST,EXTERNAL_CONTROL as gExternalControl,HELP_MENU } from './nehubaUI.services'
import { EventPacket } from './nehuba.model'
import { NehubaViewerInnerContainer } from './nehubaUI.viewer.component'
import { ModalHandler } from './nehubaUI.modal.component'

declare var window:{
    [key:string] : any
    prototype : Window;
    new() : Window;
}

@Component({
    selector : 'ATLASViewer',
    template : `
        <NehubaViewer 
            (mousemove)="mousemove($event);mouseEventHandler('mousemove',$event)"
            (click) = "mouseEventHandler('click',$event)"
            (mousedown) = "mouseEventHandler('mousedown',$event)"
            (mouseup) = "mouseEventHandler('mouseup',$event)"></NehubaViewer>
        <span id="helpbutton" (click)="showhelp()" [ngClass]="{darktheme : darktheme}" class = "glyphicon glyphicon-question-sign unicodeSymbols"></span>
        <span id="hideUI" (click)="toggleHideUI()" [ngClass]="{darktheme : darktheme,'glyphicon-resize-full':!hideUI,'glyphicon-resize-small':hideUI}" class = "glyphicon unicodeSymbols"></span>
    `
})

export class NehubaViewerContainer {
    darktheme : boolean
    @Input() hideUI : boolean = false
    @Output() emitHideUI : EventEmitter<any> = new EventEmitter()
    @ViewChild(NehubaViewerInnerContainer) nehubaViewerInnerContainer : NehubaViewerInnerContainer

    constructor(private eventCenter : EventCenter){
        this.eventCenter.globalLayoutRelay.subscribe((msg:EventPacket)=>{
            switch(msg.target){
                case EVENTCENTER_CONST.GLOBALLAYOUT.TARGET.THEME:{
                    this.darktheme = msg.body.theme == 'dark' 
                }break;
            }
        })
    }

    mouseEventHandler(mode:string,ev:any){
        gExternalControl.mouseEvent.next(new EventPacket(mode,'',100,ev))
    }

    toggleHideUI(){
        this.emitHideUI.emit({hideUI:!this.hideUI})
        if( this.nehubaViewerInnerContainer && this.nehubaViewerInnerContainer.nehubaViewerComponent ){
            this.nehubaViewerInnerContainer.nehubaViewerComponent.nehubaViewer.redraw()
        }
    }

    mousemove(event:any){
        this.eventCenter.userViewerInteractRelay.next(new EventPacket('mousemove',Date.now().toString(),100,{event:event}))
    }

    showhelp(){
        const modalHandler = <ModalHandler>window['nehubaUI'].util.modalControl.getModalHandler()
        modalHandler.title = `<h4>Help</h4>`
        modalHandler.body = HELP_MENU
        modalHandler.footer
        modalHandler.show()
    }
}