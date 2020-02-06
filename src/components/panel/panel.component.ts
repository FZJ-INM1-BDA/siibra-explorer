import { ChangeDetectionStrategy, Component, ElementRef, Input, ViewChild } from "@angular/core";
import { ParseAttributeDirective } from "../parseAttribute.directive";

@Component({
  selector : 'panel-component',
  templateUrl : './panel.template.html',
  styleUrls : [
    `./panel.style.css`,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class PanelComponent extends ParseAttributeDirective {

  @Input() public showHeading: boolean = true
  @Input() public showBody: boolean = true
  @Input() public showFooter: boolean = false

  @Input() public collapseBody: boolean = false
  @Input() public bodyCollapsable: boolean = false

  @ViewChild('panelBody', { read : ElementRef }) public efPanelBody: ElementRef
  @ViewChild('panelFooter', { read : ElementRef }) public efPanelFooter: ElementRef

  constructor() {
    super()
  }

  public toggleCollapseBody(_event: Event) {
    if (this.bodyCollapsable) {
      this.collapseBody = !this.collapseBody
      this.showBody = !this.showBody
      this.showFooter = !this.showFooter
    }
  }
}
