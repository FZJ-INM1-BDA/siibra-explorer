import { OnChanges, Input, Component } from '@angular/core'
import { UI_CONTROL, MainController, MultilevelProvider } from 'nehubaUI/nehubaUI.services'
import { RegionDescriptor } from 'nehubaUI/nehuba.model';

import template from './nehubaUI.regionMultilevel.template.html'
import css from './nehubaUI.regionMultilevel.style.css'

@Component({
  selector : 'atlascontrol',
  template : template,
  styles : [ css ],
  providers : [ MultilevelProvider ]
})

export class NehubaUIRegionMultilevel implements OnChanges{
  @Input() searchTerm : string = ''

  constructor(public mainController:MainController,public multilevelProvider:MultilevelProvider){

  }

  muteFilter = (m:RegionDescriptor):boolean=>{
    return this.mainController.viewingMode != 'Select atlas regions' && m.moreInfo.findIndex(info=>info.name==this.mainController.viewingMode) < 0 
  }

  highlightFilter = (m:RegionDescriptor):boolean=>{
    return this.mainController.selectedRegions.findIndex(r=>r==m) >= 0
  }

  ngOnChanges(){
    this.multilevelProvider.searchTerm = this.searchTerm
  }

  multilevelSingleClick(m:RegionDescriptor){
    if( m.children.length > 0 ){
      if( m.hasEnabledChildren()){
        this.multilevelProvider.disableSelfAndAllChildren(m)
      } else {
        this.multilevelProvider.enableSelfAndAllChildren(m)
      }
    }else{
      this.multilevelProvider.toggleRegionSelect(m)
    }
  }

  multilevelDoubleClick(m:RegionDescriptor){
    
    m.isExpanded = !m.isExpanded
    const gothere = m.moreInfo.find(info=>info.name=='Go To There')
    if(gothere) gothere.action()
  }

  showMoreInfo(_item:any):void{
    // console.log(_item)
    const modalHandler = UI_CONTROL.modalControl.getModalHandler()
    modalHandler.title = `<h4>More information on ${_item.name}</h4>`
    modalHandler.body = _item.properties
    modalHandler.footer = null
    modalHandler.show()
  }

  clearAllSelections(){
    this.mainController.selectedRegions = []
    this.mainController.regionSelectionChanged()
  }
}