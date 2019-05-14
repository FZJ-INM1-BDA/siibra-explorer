import { Component, Input, ViewChild, ElementRef, AfterContentChecked, ChangeDetectionStrategy, ChangeDetectorRef, OnChanges, SimpleChanges, HostBinding, ApplicationRef } from "@angular/core";
import { panelAnimations } from "./panel.animation";
import { ParseAttributeDirective } from "../parseAttribute.directive";

@Component({
  selector : 'panel-component',
  templateUrl : './panel.template.html',
  styleUrls : [
    `./panel.style.css`
  ],
  animations : [
    panelAnimations
  ],
  host: {
    '[class]': 'getClassNames'
  },
  changeDetection:ChangeDetectionStrategy.OnPush
})

export class PanelComponent extends ParseAttributeDirective implements AfterContentChecked{

  @Input() showHeading : boolean = true
  @Input() showBody : boolean = true
  @Input() showFooter : boolean = false

  @Input() collapseBody : boolean = false
  @Input() bodyCollapsable : boolean = false

  @Input() containerClass : string = ''

  @ViewChild('panelBody',{ read : ElementRef }) efPanelBody : ElementRef
  @ViewChild('panelFooter',{ read : ElementRef }) efPanelFooter : ElementRef

  _fullHeight : number = 0

  constructor(private cdr:ChangeDetectorRef){
    super()
  }

  get getClassNames(){
    return `panel ${this.containerClass === '' ? 'panel-default' : this.containerClass}`
  }

  ngAfterContentChecked(){
    /**
     * TODO check performance implication. 
     * setting height forces a repaint (?)
     */
    this.fullHeight = (this.efPanelBody ? this.efPanelBody.nativeElement.offsetHeight : 0) +
      (this.efPanelFooter ? this.efPanelFooter.nativeElement.offsetHeight : 0)
    this.cdr.detectChanges()
  }

  @HostBinding('class.panel-default')

  set fullHeight(num:number){
    this._fullHeight = num
  }

  get fullHeight(){
    return this._fullHeight
  }

  toggleCollapseBody(event:Event){
    if(this.bodyCollapsable){
      this.collapseBody = !this.collapseBody
      this.showBody = !this.showBody
      this.showFooter = !this.showFooter

      // this.fullHeight = (this.efPanelBody ? this.efPanelBody.nativeElement.offsetHeight : 0) +
      //   (this.efPanelFooter ? this.efPanelFooter.nativeElement.offsetHeight : 0)
    }
    event.stopPropagation()
    event.preventDefault()
  }
}
