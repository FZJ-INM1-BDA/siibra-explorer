import { Input, Component, ViewChildren } from '@angular/core'
import { Multilevel } from './nehuba.model'
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

  constructor(public mainController:MainController,public multilevelProvider:MultilevelProvider){}

  chooseLevel = (data:Multilevel):void => 
    data.hasEnabledChildren() ? 
      data.disableSelfAndAllChildren() : 
      data.enableSelfAndAllChildren()

  toggleExpansion = (m:Multilevel):boolean => m.isExpanded = !m.isExpanded
}