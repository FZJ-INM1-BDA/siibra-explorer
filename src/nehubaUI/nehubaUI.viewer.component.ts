import { Component,Input,Output,AfterViewInit } from '@angular/core'
import { createNehubaViewer,NehubaViewer } from 'nehuba/exports'
import { BigBrain,JuBrain } from '../dataset/datasetConfig'

@Component({
    selector : 'ATLASViewer',
    template : `
        <div [ngClass]="{darktheme : darktheme}" id="container"></div>
    `
})

export class NehubaViewerContainer implements AfterViewInit{
    @Input() darktheme : boolean
    @Output() public nehubaViewer:NehubaViewer

    ngAfterViewInit(){
        JuBrain
        let nehubaConfig = BigBrain
        this.nehubaViewer = createNehubaViewer(nehubaConfig)
        this.nehubaViewer.disableSegmentSelectionForLoadedLayers()
    }
}