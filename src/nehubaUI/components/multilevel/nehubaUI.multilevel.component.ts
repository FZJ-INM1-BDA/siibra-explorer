import { Output, Input, Component, ViewChildren, EventEmitter } from '@angular/core'
import { Multilevel } from 'nehubaUI/nehuba.model'
import { MainController, MultilevelProvider } from 'nehubaUI/nehubaUI.services';

import template from './nehubaUI.multilevel.template.html'
import css from './nehubaUI.multilevel.style.css'

@Component({
  selector : 'multilevel',
  template : template,
  styles : [
    css,
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
]
})

export class MultilevelSelector {

  @Input() isVisible : boolean = true

  @Input() getValueToShow : (m:Multilevel)=>string = (m)=>m.name
  @Input() muteFilter : (m:Multilevel)=>boolean = ()=>false
  @Input() highlightFilter : (m:Multilevel)=>boolean = ()=>false

  @Input() data : Multilevel
  @Input() selectedData : Multilevel[]
  @ViewChildren(MultilevelSelector) childrenMultilevel : MultilevelSelector[] = []
  
  @Output() singleClick : EventEmitter<Multilevel> = new EventEmitter()
  @Output() doubleClick : EventEmitter<Multilevel> = new EventEmitter()
  @Output() mouseoverMultilevel : EventEmitter<Multilevel> = new EventEmitter()
  @Output() mouseoutMultilevel : EventEmitter<Multilevel> = new EventEmitter()

  debounceFlag : boolean = true
  debounceTimer : any

  constructor(public mainController:MainController,public multilevelProvider:MultilevelProvider){}

  toggleExpansion = (m:Multilevel):boolean => m.isExpanded = !m.isExpanded

  multilvlClick(m:Multilevel){
    if(this.debounceFlag){
      this.debounceFlag = false
      this.debounceTimer = setTimeout(()=>{
        this.realSingleClick(m)
        this.debounceFlag = true
      },250)
    }else{
      clearTimeout(this.debounceTimer)
      this.debounceFlag = true
      this.realDoubleClick(m)
    }
  }

  realSingleClick(m:Multilevel){
    this.singleClick.emit(m)
  }

  realDoubleClick(m:Multilevel){
    this.doubleClick.emit(m)
  }

  test(){
    console.log('test')
  }
}