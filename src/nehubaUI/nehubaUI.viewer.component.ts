import { Component,Input,Output,AfterViewInit,EventEmitter } from '@angular/core'
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
    @Output() showModal:EventEmitter<string> = new EventEmitter()

    constructor(private eventCenter : EventCenter){}

    ngAfterViewInit(){
        JuBrain
        let nehubaConfig = BigBrain
        this.nehubaViewer = createNehubaViewer(nehubaConfig)
        this.nehubaViewer.disableSegmentSelectionForLoadedLayers()

        this.nehubaViewer.setNavigationStateCallbackInVoxelCoordinates((pos,ori)=>{
            this.eventCenter.navigationUpdateRelay.next(new EventPacket('updateNavigation',Date.now().toString(),100,{pos:pos,ori:ori}))
        })
    }

    showhelp(){
        this.showModal.emit('showHelpModal')
    }
}