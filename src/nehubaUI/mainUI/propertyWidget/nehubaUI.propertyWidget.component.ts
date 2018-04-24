import { Component, Input, TemplateRef, OnChanges, EventEmitter, Output } from '@angular/core'

import template from './nehubaUI.propertyWidget.template.html'
import css from './nehubaUI.propertyWidget.style.css'
import { DatasetInterface } from 'nehubaUI/nehuba.model';
import { InfoToUIService, MainController } from 'nehubaUI/nehubaUI.services';
import { INTERACTIVE_VIEWER } from 'nehubaUI/exports';

/* purpose of the PropertyWidget is to show the info icon and functionalise the info icon, showing the addition info */

@Component({
  selector : 'property-widget',
  template,
  styles : [ css ]
})

export class PropertyWidget implements OnChanges{
  
  @Input() title : string = `Property`
  @Input() inputComponent : HasPropertyInterface
  @Output() dismiss : EventEmitter<boolean> = new EventEmitter()

  constructor(public infoToUI:InfoToUIService,public mainController:MainController){
    
  }

  ngOnChanges(){
    /* TODO temporary measure in fetching more info on regions */
    if(!this.inputComponent.properties && this.inputComponent.propertiesURL){
      fetch(this.inputComponent.propertiesURL)
        .then(r=>r.json())
        .then(json=>this.inputComponent.properties=json)
        .catch(console.warn)
    }
  }

  showPropertyModal(templateRef:TemplateRef<any>){
    // console.log(this.inputComponent)
    const handler = this.infoToUI.getModalHandler()
    handler.title = `${this.title}`
    handler.showTemplateRef(templateRef)
  }

  moveToRoi(pos:[number,number,number]){
    INTERACTIVE_VIEWER.viewerHandle.moveToNavigationLoc(pos,true)
  }

  preventDefault(ev:Event){
    ev.preventDefault()
    ev.stopPropagation()
  }
}

export interface HasPropertyInterface{
  position? : [number,number,number]
  properties? : DatasetInterface
  propertiesURL? : string
  dismiss? : ()=>void
}