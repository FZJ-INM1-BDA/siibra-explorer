import { Component, Input, OnChanges, AfterViewInit } from '@angular/core'

import template from './nehubaUI.collapsablePanel.template.html'
import css from './nehubaUI.collapsablePanel.style.css'
import { animateCollapseShow } from 'nehubaUI/util/nehubaUI.util.animations';
import { HasPropertyInterface } from 'nehubaUI/mainUI/propertyWidget/nehubaUI.propertyWidget.component';

@Component({
  selector : 'collapsable-panel',
  template : template,
  styles : [css],
  animations : [animateCollapseShow]
})

export class CollapsablePanel implements OnChanges,AfterViewInit{
  @Input() panelShow : boolean = false
  @Input() title : string = 'Untitled Panel'
  @Input() propertyWidget : HasPropertyInterface
  
  renderContent : boolean = false

  ngOnChanges(){
    this.renderContent = this.panelShow
  }

  ngAfterViewInit(){
    this.renderContent = this.panelShow
  }

  toggleShow(){
    if(!this.panelShow) this.renderContent = true
    this.panelShow = !this.panelShow
  }

  animationEnd(){
    if(!this.panelShow) this.renderContent = false
  }
}
