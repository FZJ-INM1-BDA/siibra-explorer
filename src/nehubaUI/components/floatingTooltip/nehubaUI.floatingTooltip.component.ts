import { ViewChild,Input,Component, TemplateRef, ViewContainerRef, AfterViewInit } from '@angular/core'
import { MainController } from 'nehubaUI/nehubaUI.services';

import template from './nehubaUI.floatingTooltip.template.html'
import css from './nehubaUI.floatingTooltip.style.css'

@Component({
  selector : 'floatingPopover',
  template : template,
  styles : [ css ]
})

export class FloatingTooltip implements AfterViewInit{
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