import { ViewChild,Input,Component, TemplateRef, ViewContainerRef, AfterViewInit } from '@angular/core'
import { MainController } from 'nehubaUI/nehubaUI.services';

@Component({
  selector : 'floatingPopover',
  template : 
`
<div 
  (mousedown)="$event.stopPropagation()"
  class = "popover down" 
  style = "display:block;position:absolute;"
  [ngStyle] = "overwriteStyle"
  [style.left] = "offset[0] + 'px'"
  [style.top] = "offset[1] + 'px'"
  popoverContainer>

  <h3 
    *ngIf = "title" 
    [innerHTML] = "title"
    class = "popover-title popover-header">
  </h3>
  <div 
    class = "popover-content popover-body"
    #panelBody>
  </div>
</div>
`,
  styles : [
    `
    [popoverContainer]
    {
      border:none;
    }
    .popover-content.popover-body
    {
      padding: 0px;
      border:none;
    }
    `
  ]
})

export class FloatingPopOver implements AfterViewInit{
  @Input() offset :[number,number] = [-1000,-1000]
  @Input() templateTobeRendered : TemplateRef<any>
  @Input() overwriteStyle : any = {}
  @Input() title : string

  @ViewChild('panelBody',{read:ViewContainerRef})panelBody : ViewContainerRef

  constructor(public mainController:MainController){

  }

  ngAfterViewInit(){
    if(this.templateTobeRendered){
      this.panelBody.createEmbeddedView( this.templateTobeRendered )
    }
  }
}