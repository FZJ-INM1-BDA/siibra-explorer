import { Input, Component, ViewChildren } from '@angular/core'
import { Multilevel } from './nehuba.model'

@Component({
  selector : 'multilevel',
  templateUrl : 'src/nehubaUI/templates/nehubaUI.multilevel.template.html',
  styles : [` 
    :host >>> span.highlight
    {
    background-color:#770;
    }
  `],
  styleUrls : ['src/nehubaUI/templates/nehubaUI.multilevel.template.css']
})

export class MultilevelSelector {

  @Input() searchTerm : string
  @Input() data : Multilevel[]
  @Input() selectedData : Multilevel[]
  @ViewChildren(MultilevelSelector) childrenMultilevel : MultilevelSelector[]

  constructor(){}

  chooseLevel = (data:Multilevel):void => 
    data.hasEnabledChildren() ? 
      data.disableSelfAndAllChildren() : 
      data.enableSelfAndAllChildren()

  toggleExpansion = (m:Multilevel):boolean => m.isExpanded = !m.isExpanded
}