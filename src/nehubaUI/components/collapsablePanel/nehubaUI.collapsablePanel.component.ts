import { Component, Input, OnChanges, AfterViewInit, EventEmitter, Output, OnDestroy } from '@angular/core'

import template from './nehubaUI.collapsablePanel.template.html'
import css from './nehubaUI.collapsablePanel.style.css'
import { animateCollapseShow } from 'nehubaUI/util/nehubaUI.util.animations';
import { HasPropertyInterface } from 'nehubaUI/mainUI/propertyWidget/nehubaUI.propertyWidget.component';
import { MasterCollapsableController } from 'nehubaUI/nehubaUI.services';
import { Subject,Observable } from 'rxjs/Rx';

@Component({
  selector : 'collapsable-panel',
  template : template,
  styles : [css],
  animations : [animateCollapseShow]
})

export class CollapsablePanel implements OnChanges,AfterViewInit,OnDestroy{
  @Input() panelShow : boolean = false
  @Input() title : string = 'Untitled Panel'
  @Input() propertyWidget : HasPropertyInterface
  @Output() dismiss : EventEmitter<boolean> = new EventEmitter()
  
  renderContent : boolean = false
  destroySubject : Subject<boolean> = new Subject()

  constructor(public masterCollapsableController?:MasterCollapsableController){
    if(this.masterCollapsableController){
      Observable
        .from(this.masterCollapsableController.expandBSubject)
        .takeUntil(this.destroySubject)
        .subscribe(ev=>ev ? this.show() : this.hide())
    }
  }

  ngOnDestroy(){
    this.destroySubject.next(true)
  }

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

  show(){
    this.renderContent = true
    this.panelShow = true
  }

  hide(){
    this.panelShow = false
  }
}

/* 
TODO render on demand saves initial loading time, but on mass collapse is computationally expensive
perhaps render on init? 
*/