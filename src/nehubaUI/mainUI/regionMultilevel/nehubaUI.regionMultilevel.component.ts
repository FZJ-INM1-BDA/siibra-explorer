import { OnChanges, Input, Component } from '@angular/core'
import { MainController, MultilevelProvider, InfoToUIService } from 'nehubaUI/nehubaUI.services'
import { RegionDescriptor } from 'nehubaUI/nehuba.model';

import template from './nehubaUI.regionMultilevel.template.html'
import css from './nehubaUI.regionMultilevel.style.css'
import { INTERACTIVE_VIEWER } from 'nehubaUI/exports';

@Component({
  selector : 'atlascontrol',
  template : template,
  styles : [ css ],
  providers : [ MultilevelProvider ]
})

export class NehubaUIRegionMultilevel implements OnChanges{
  @Input() searchTerm : string = ''
  @Input() regions : RegionDescriptor[] = []

  constructor(
    private infoToUI:InfoToUIService,
    public mainController:MainController,
    public multilevelProvider:MultilevelProvider){

    this.mainController.selectedRegionsBSubject.subscribe(regions=>{
      
      this.multilevelProvider.selectedMultilevel = regions
    })
  }

  getDisplayName = (m:RegionDescriptor):string =>{
    return m.name
  }

  /* TODO configure the mutefilter properly. decide  */
  muteFilter = (_m:RegionDescriptor):boolean=>{
    return false
  }

  highlightFilter = (m:RegionDescriptor):boolean=>{
    return this.mainController.selectedRegions.findIndex(r=>r==m) >= 0
  }

  ngOnChanges(){
    this.multilevelProvider.searchTerm = this.searchTerm
  }

  multilevelSingleClick(m:RegionDescriptor){
    if( m.children.length > 0 ){
      if( this.multilevelProvider.hasEnabledChildren(m) ){
        this.multilevelProvider.disableSelfAndAllChildren(m)
      } else {
        this.multilevelProvider.enableSelfAndAllChildren(m)
      }
    }else{
      this.multilevelProvider.toggleRegionSelect(m)
    }
    this.updateRegionSelection()
  }

  mouseoverMultilevel(m:RegionDescriptor){
    m.datasets.forEach(ds=>ds.highlight = true)
  }

  mouseoutMultilevel(m:RegionDescriptor){
    m.datasets.forEach(ds=>ds.highlight = false)
  }

  multilevelDoubleClick(m:RegionDescriptor){
    
    m.isExpanded = !m.isExpanded
    
    if(m.position){
      INTERACTIVE_VIEWER.viewerHandle.moveToNavigationLoc(m.position,true)
    }
  }

  showMoreInfo(_item:any):void{
    // console.log(_item)
    const modalHandler = this.infoToUI.getModalHandler()
    modalHandler.title = `<h4>More information on ${_item.name}</h4>`
    modalHandler.body = _item.properties
    modalHandler.footer = null
    modalHandler.show()
  }

  clearAllSelections(){
    this.mainController.selectedRegionsBSubject.next([])
  }

  updateRegionSelection(){
    this.mainController.selectedRegionsBSubject.next(this.multilevelProvider.selectedMultilevel as RegionDescriptor[])
  }

  getValueToShow(m:RegionDescriptor){
    return m.name
  }
}