import { Component, Input, ViewChild, ElementRef, AfterContentChecked } from "@angular/core";
import { panelAnimations } from "./panel.animation";

@Component({
  selector : 'panel',
  templateUrl : './panel.template.html',
  styleUrls : [
    `./panel.style.css`
  ],
  animations : [
    panelAnimations
  ]
})

export class PanelComponent implements AfterContentChecked{

  @Input() showHeading : boolean = true
  @Input() showBody : boolean = true
  @Input() showFooter : boolean = false

  @Input() collapseBody : boolean = false
  @Input() bodyCollapsable : boolean = false

  @Input() containerClass : string = ''

  @ViewChild('panelBody',{ read : ElementRef }) efPanelBody : ElementRef
  @ViewChild('panelFooter',{ read : ElementRef }) efPanelFooter : ElementRef

  _fullHeight : number = 0

  ngAfterContentChecked(){
    this.fullHeight = (this.efPanelBody ? this.efPanelBody.nativeElement.offsetHeight : 0) +
      (this.efPanelFooter ? this.efPanelFooter.nativeElement.offsetHeight : 0)
  }

  set fullHeight(num:number){
    this._fullHeight = num
  }

  get fullHeight(){
    return this._fullHeight
  }

  toggleCollapseBody(event:Event){
    if(this.bodyCollapsable){
      this.collapseBody = !this.collapseBody

      this.fullHeight = (this.efPanelBody ? this.efPanelBody.nativeElement.offsetHeight : 0) +
        (this.efPanelFooter ? this.efPanelFooter.nativeElement.offsetHeight : 0)
    }
    event.stopPropagation()
    event.preventDefault()
  }
}