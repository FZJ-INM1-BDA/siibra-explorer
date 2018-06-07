import { Component, Input, ChangeDetectionStrategy } from "@angular/core";

@Component({
  selector : 'panel',
  templateUrl : './panel.template.html',
  styleUrls : [
    `./panel.style.css`
  ]
})

export class PanelComponent{

  @Input() showHeading : boolean = true
  @Input() showBody : boolean = true
  @Input() showFooter : boolean = false

  @Input() collapseBody : boolean = false
  @Input() bodyCollapsable : boolean = false

  toggleCollapseBody(event:Event){
    if(this.bodyCollapsable){
      this.collapseBody = !this.collapseBody
    }
    event.stopPropagation()
    event.preventDefault()
  }
}