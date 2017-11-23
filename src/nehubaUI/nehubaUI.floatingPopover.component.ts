import { Component } from '@angular/core'
import { RegionDescriptor } from './nehuba.model'

@Component({
    selector : 'floatingPopover',
    template : 
`
<div 
    (mousedown)="$event.stopPropagation()"
    class = "popover down" 
    style = "display:block;position:absolute"
    [style.left]="contextmenuEvent ? contextmenuEvent.target.offsetLeft + contextmenuEvent.layerX + 'px' : '-1000px'"
    [style.top]="contextmenuEvent ? contextmenuEvent.target.offsetTop + contextmenuEvent.layerY + 'px' : '-1000px'">

    <h3 class = "popover-title popover-header">
        <span *ngIf = "cursorSegment && cursorSegment.constructor.name == 'RegionDescriptor'">{{cursorSegment.name}}</span>
        <span *ngIf = "!cursorSegment">No segment selected</span>
    </h3>
    <div class = "popover-content popover-body">
        <small>
            Position: <br />
            realspace(nm): ({{cursorLocReal.join(',')}})<br />
            voxelspace : ({{cursorLocVoxel.join(',')}})
        </small><br />
        <span *ngIf = "cursorSegment">
            <span 
                *ngFor = "let moreInfo of cursorSegment.moreInfo"
                class = "moreInfo-icon glyphicon"
                (click) = "moreInfo.action()"
                [ngClass] = "'glyphicon-' + moreInfo.icon"
                [tooltip] = "moreInfo.name">
            </span>
        </span>
        <span 
            *ngFor = "let moreInfo of otherTools"
            class = "moreInfo-icon glyphicon"
            (click) = "moreInfo.action()"
            [ngClass] = "'glyphicon-' + moreInfo.icon"
            [tooltip] = "moreInfo.name">
        </span>
    </div>
</div>
`
})

export class FloatingPopOver {
    cursorLocReal : number[] = [0,0,0]
    cursorLocVoxel : number[] = [0,0,0]
    cursorSegment : RegionDescriptor | number | null
    contextmenuEvent : any

    otherTools : any[] = []
}