import { Output, Input, Component, ViewChildren, EventEmitter } from '@angular/core'
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

  @Input() isVisible : boolean = true

  @Input() muteFilter : (m:Multilevel)=>boolean = ()=>false
  @Input() highlightFilter : (m:Multilevel)=>boolean = ()=>false

  @Input() data : Multilevel
  @Input() selectedData : Multilevel[]
  @ViewChildren(MultilevelSelector) childrenMultilevel : MultilevelSelector[] = []
  
  @Output() singleClick : EventEmitter<Multilevel> = new EventEmitter()
  @Output() doubleClick : EventEmitter<Multilevel> = new EventEmitter()

  debounceFlag : boolean = true
  debounceTimer : any

  constructor(public mainController:MainController,public multilevelProvider:MultilevelProvider){}

  chooseLevel = (data:Multilevel):void => 
    data.hasEnabledChildren() ? 
      data.disableSelfAndAllChildren() : 
      data.enableSelfAndAllChildren()

  toggleExpansion = (m:Multilevel):boolean => m.isExpanded = !m.isExpanded

  multilvlClick(m:RegionDescriptor){
    if(this.debounceFlag){
      this.debounceFlag = false
      this.debounceTimer = setTimeout(()=>{
        this.realSingleClick(m)
        this.debounceFlag = true
      },300)
    }else{
      clearTimeout(this.debounceTimer)
      this.debounceFlag = true
      this.realDoubleClick(m)
    }
  }

  realSingleClick(m:Multilevel){
    m.isExpanded = !m.isExpanded
    this.singleClick.emit(m)
  }

  realDoubleClick(m:Multilevel){
    if( m.children.length > 0 ){
      if( m.hasEnabledChildren()){
        this.multilevelProvider.disableSelfAndAllChildren(m)
      } else {
        this.multilevelProvider.enableSelfAndAllChildren(m)
      }
    }else{
      this.multilevelProvider.toggleRegionSelect(m)
    }
    this.doubleClick.emit(m)
  }
}