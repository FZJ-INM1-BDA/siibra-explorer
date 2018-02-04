import { Input, Component, ViewChildren } from '@angular/core'
import { Multilevel, RegionDescriptor } from './nehuba.model'
import { MainController, MultilevelProvider } from 'nehubaUI/nehubaUI.services';

@Component({
  selector : 'multilevel',
  templateUrl : 'src/nehubaUI/templates/nehubaUI.multilevel.template.html',
  styles : [
    ` 
    :host >>> span.highlight
    {
    background-color:#770;
    }
    `,
    `
    div[multilevelContainer]
    {
      position:relative;
      overflow:visible;
    }

    span.regionHasMoreInfo:hover
    {
      cursor:default;
    }

    .multilvlContainer
    {
      padding-top:0.1em;
      padding-bottom:0.1em;
    }    

    .multilevel-name,.multilevel-name > span[spanName]
    {
      flex: 0 1 auto;
      overflow:hidden;
      display:flex;
      white-space:nowrap;
    }

    .multilevel-name > span[spanName]
    {
      margin-left:0.5em;
      user-select : none;
    }

    .glyphicon
    {
      flex: 0 0 1.2em;
      align-self: center;
      text-align:center;
    }
    `
  ],
  styleUrls : ['src/nehubaUI/templates/nehubaUI.multilevel.template.css']
})

export class MultilevelSelector {

  @Input() data : Multilevel[]
  @Input() selectedData : Multilevel[]
  @ViewChildren(MultilevelSelector) childrenMultilevel : MultilevelSelector[]

  debounceFlag : boolean = true
  debounceTimer : any

  constructor(public mainController:MainController,public multilevelProvider:MultilevelProvider){}

  chooseLevel = (data:Multilevel):void => 
    data.hasEnabledChildren() ? 
      data.disableSelfAndAllChildren() : 
      data.enableSelfAndAllChildren()

  toggleExpansion = (m:Multilevel):boolean => m.isExpanded = !m.isExpanded

  hasTextMutedClass(singleData:RegionDescriptor):boolean{
    return this.mainController.viewingMode != 'navigation (default mode)' && singleData.moreInfo.findIndex(info=>info.name==this.mainController.viewingMode) < 0 
  }

  isSelectedByMainController(thisRegion:RegionDescriptor){
    return this.mainController.selectedRegions.findIndex(r=>r==thisRegion) >= 0
  }

  singleClick(m:RegionDescriptor){
    if(this.debounceFlag){
      this.debounceFlag = false
      this.debounceTimer = setTimeout(()=>{
        this.realSingleClick(m)
        this.debounceFlag = true
      },200)
    }else{
      clearTimeout(this.debounceTimer)
      this.debounceFlag = true
      this.doubleClick(m)
    }
  }

  realSingleClick(m:RegionDescriptor){
    const gothere = m.moreInfo.find(info=>info.name=='Go To There')
    if(gothere) gothere.action()
    m.isExpanded = !m.isExpanded
  }

  doubleClick(m:RegionDescriptor){
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
}