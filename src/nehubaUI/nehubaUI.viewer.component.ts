import { Component,Input,Output,AfterViewInit } from '@angular/core'
import { createNehubaViewer,NehubaViewer } from 'nehuba/exports'
import { BigBrain,JuBrain } from '../dataset/datasetConfig'
import { EventCenter } from './nehubaUI.services'
import { EventPacket } from './nehuba.model'

@Component({
    selector : 'ATLASViewer',
    template : `
        <div [ngClass]="{darktheme : darktheme}" id="container"></div>
        <span id="helpbutton" (click)="showhelp()" [ngClass]="{darktheme : darktheme}" class = "glyphicon glyphicon-question-sign unicodeSymbols"></span>
    `
})

export class NehubaViewerContainer implements AfterViewInit{
    @Input() darktheme : boolean
    @Output() public nehubaViewer:NehubaViewer

    constructor(private eventCenter : EventCenter){}

    ngAfterViewInit(){
        /* consider what to do with this... how to load default view ? */
        JuBrain
        let nehubaConfig = BigBrain
        this.nehubaViewer = createNehubaViewer(nehubaConfig)
        this.nehubaViewer.disableSegmentSelectionForLoadedLayers()

        this.nehubaViewer.setNavigationStateCallbackInVoxelCoordinates((pos,ori)=>{
            this.eventCenter.navigationUpdateRelay.next(new EventPacket('updateNavigation',Date.now().toString(),100,{pos:pos,ori:ori}))
        })
    }

    showhelp(){
        this.eventCenter.modalEventRelay.next(new EventPacket('showInfoModal',Date.now().toString(),100,{title:"Basic Controls",body:this.helpMenu}))
        // this.showModal.emit('showHelpModal')
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