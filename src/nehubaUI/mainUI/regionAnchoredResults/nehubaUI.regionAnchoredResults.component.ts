import { Component } from '@angular/core'

import template from './nehubaUI.regionAnchoredResults.template.html'
import css from './nehubaUI.regionAnchoredResults.style.css'
import { animationFadeInOut } from 'nehubaUI/util/nehubaUI.util.animations';

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
  
  renderFullList : boolean = true
  renderRegionFilter : boolean = false

  toggle(){
    this.viewList = !this.viewList
    if(this.viewList)this.renderRegionFilter = false
    else this.renderFullList = false
  }
  
  animationDone(){
    if(this.viewList)this.renderFullList = true
    else this.renderRegionFilter = true
  }
}