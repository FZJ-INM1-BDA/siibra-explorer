import { Component } from '@angular/core'
import { RegionDescriptor } from './nehuba.model'

@Component({
  selector : 'floatingPopover',
  template : 
`
<div 
  (mousedown)="$event.stopPropagation()"
  class = "popover down" 
  style = "display:block;position:absolute;left:-10000px;top:-10000px"
  [style.left]="contextmenuEvent ? contextmenuEvent.target.offsetLeft + contextmenuEvent.layerX + 'px' : '-1000px'"
  [style.top]="contextmenuEvent ? contextmenuEvent.target.offsetTop + contextmenuEvent.layerY + 'px' : '-1000px'">

  <h3 class = "popover-title popover-header">
    <span *ngIf = "cursorSegment && cursorSegment.constructor.name != 'Number'">{{cursorSegment.name}}</span>
    <span *ngIf = "!cursorSegment">No segment selected</span>
  </h3>
  <div class = "popover-content popover-body">
  
    <ng-template>
    <small>
      Position: <br />
      realspace(nm): ({{cursorLocReal.join(',')}})<br />
      voxelspace : ({{cursorLocVoxel.join(',')}})
    </small><br />
    </ng-template>

    <div *ngIf="cursorSegment">
      <div
        class="moreInfo-icon"
        (click) = "contextmenuEvent=null;moreInfo.action()"
        *ngFor = "let moreInfo of cursorSegment.moreInfo">
          <span 
            class = "glyphicon"
            [ngClass] = "'glyphicon-' + moreInfo.icon"
            [tooltip] = "moreInfo.name">
          </span>
          <span>{{moreInfo.name}}</span>
      </div>
    </div>

    <div
      class="moreInfo-icon"
      (click) = "contextmenuEvent=null;moreInfo.action()"
      *ngFor = "let moreInfo of otherTools">
        <span 
          class = "glyphicon"
          [ngClass] = "'glyphicon-' + moreInfo.icon">
        </span>
        <span>{{moreInfo.name}}</span>
    </div>
  </div>
</div>
`,
  styles : [
    `
    .clickableText
    {
      color:goldenrod;
      cursor:default;
    }
    `
  ]
})

export class FloatingPopOver {
  cursorLocReal : number[] = [0,0,0]
  cursorLocVoxel : number[] = [0,0,0]
  cursorSegment : RegionDescriptor | number | null
  contextmenuEvent : any

  otherTools : any[] = []
}