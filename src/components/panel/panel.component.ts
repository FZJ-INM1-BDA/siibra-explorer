import { Component, Input, ViewChild, ElementRef, AfterContentChecked, ChangeDetectionStrategy, ChangeDetectorRef, OnChanges, SimpleChanges, HostBinding, ApplicationRef } from "@angular/core";
import { panelAnimations } from "./panel.animation";
import { ParseAttributeDirective } from "../parseAttribute.directive";

@Component({
  selector : 'panel-component',
  templateUrl : './panel.template.html',
  styleUrls : [
    `./panel.style.css`
  ],
  host: {
    '[class]': 'getClassNames'
  },
  changeDetection:ChangeDetectionStrategy.OnPush
})

export class PanelComponent extends ParseAttributeDirective {

  @Input() showHeading : boolean = true
  @Input() showBody : boolean = true
  @Input() showFooter : boolean = false

  @Input() collapseBody : boolean = false
  @Input() bodyCollapsable : boolean = false

  @Input() containerClass : string = ''

  @ViewChild('panelBody',{ read : ElementRef }) efPanelBody : ElementRef
  @ViewChild('panelFooter',{ read : ElementRef }) efPanelFooter : ElementRef

  constructor(){
    super()
  }

  get getClassNames(){
    return `panel ${this.containerClass === '' ? 'panel-default' : this.containerClass}`
  }

  toggleCollapseBody(_event:Event){
    if(this.bodyCollapsable){
      this.collapseBody = !this.collapseBody
      this.showBody = !this.showBody
      this.showFooter = !this.showFooter
    }
  }
}
