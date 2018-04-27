import { Component } from '@angular/core'
import { Observable } from 'rxjs/Rx'

import template from './nehubaUI.regionAnchoredResults.template.html'
import css from './nehubaUI.regionAnchoredResults.style.css'
import { animationFadeInOut } from 'nehubaUI/util/nehubaUI.util.animations';
import { MainController } from 'nehubaUI/nehubaUI.services';

@Component({
  selector : `region-anchored-results`,
  template,
  styles : [
    css
  ],
  animations : [ animationFadeInOut ]
})

export class RegionAnchoredResults{
  viewList : boolean = true
  
  renderFullList : boolean = false
  renderRegionFilter : boolean = false

  constructor(private mainController:MainController){
    Observable
      .from(this.mainController.selectedRegionsBSubject)
      .debounceTime(150)
      .subscribe(srds=>{
        this.renderRegionFilter = srds.length != 0
        this.renderFullList = srds.length == 0
      })
  }
  
  animationDone(){
    if(this.viewList)this.renderFullList = true
    else this.renderRegionFilter = true
  }

  fadeOut(){
    this.viewList ? this.renderRegionFilter = false : this.renderFullList = false
  }

  fadeIn(){
    this.viewList ? this.renderFullList = true : this.renderRegionFilter = true
  }
}