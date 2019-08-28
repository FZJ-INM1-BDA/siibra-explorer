import { Component, Input, ViewChild, ElementRef, ChangeDetectionStrategy } from "@angular/core";
import { ParseAttributeDirective } from "../parseAttribute.directive";

@Component({
  selector : 'panel-component',
  templateUrl : './panel.template.html',
  styleUrls : [
    `./panel.style.css`
  ],
  changeDetection:ChangeDetectionStrategy.OnPush
})

export class PanelComponent extends ParseAttributeDirective {

  @Input() showHeading : boolean = true
  @Input() showBody : boolean = true
  @Input() showFooter : boolean = false

  @Input() collapseBody : boolean = false
  @Input() bodyCollapsable : boolean = false

  @ViewChild('panelBody',{ read : ElementRef }) efPanelBody : ElementRef
  @ViewChild('panelFooter',{ read : ElementRef }) efPanelFooter : ElementRef

  constructor(){
    super()
  }

  toggleCollapseBody(_event:Event){
    if(this.bodyCollapsable){
      this.collapseBody = !this.collapseBody
      this.showBody = !this.showBody
      this.showFooter = !this.showFooter
    }
  }
}
