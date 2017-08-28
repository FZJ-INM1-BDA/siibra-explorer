import { Component } from '@angular/core'
import { EventCenter,EVENTCENTER_CONST } from './nehubaUI.services'
import { EventPacket } from './nehuba.model'

@Component({
    selector : 'ATLASViewer',
    template : `
        <NehubaViewer (mousemove)="mousemove($event)"></NehubaViewer>
        <span id="helpbutton" (click)="showhelp()" [ngClass]="{darktheme : darktheme}" class = "glyphicon glyphicon-question-sign unicodeSymbols"></span>
    `
})

export class NehubaViewerContainer {
    darktheme : boolean

    constructor(private eventCenter : EventCenter){
        this.eventCenter.globalLayoutRelay.subscribe((msg:EventPacket)=>{
            switch(msg.target){
                case EVENTCENTER_CONST.GLOBALLAYOUT.TARGET.THEME:{
                    this.darktheme = msg.body.theme == 'dark' 
                }break;
            }
        })
    }

    mousemove(event:any){
        this.eventCenter.userViewerInteractRelay.next(new EventPacket('mousemove',Date.now().toString(),100,{event:event}))
    }

    showhelp(){
        this.eventCenter.modalEventRelay.next(new EventPacket('showInfoModal',Date.now().toString(),100,{title:"Basic Controls",body:this.helpMenu}))
    }

    helpMenu:any = 
    {
        'Mouse Controls' : {
        "Left-drag" : "within a slice view to move within that plane",
        "Shift + Left-drag" : "within a slice view to change the rotation of the slice views",
        "Mouse-Wheel" : "up or down to zoom in and out.",
        "Ctrl + Mouse-Wheel" : "moves the navigation forward and backward",
        "Ctrl + Right-click" : "within a slice to teleport to that location"
        },
        'Keyboard Controls' : {
        "tobe":"completed"
        }
    }
}