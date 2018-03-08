import { OnChanges, Input, Component } from '@angular/core'
import { UI_CONTROL, MainController, MultilevelProvider } from './nehubaUI.services'
import { ModalHandler } from './nehubaUI.modal.component'

@Component({
  selector : 'atlascontrol',
  templateUrl : 'src/nehubaUI/templates/nehubaUI.control.template.html',
  styles : [
    `
    div[regionContainer]
    {
      display:flex;
      height:100%;
      max-height:40em;
      width:100%;
      flex-direction:column;
    }
    
    div[multilevelContainer]
    {
      margin-left:1em;
      margin-right:1em;
    }

    .glyphicon-overlay
    {
      
      position:absolute;
      right:0px;
      bottom:0px;
      height:1em;
      z-index:1;
    
      margin-top:auto;
      margin-bottom:auto;
      margin-right:1em;
    }

    div[inputContainer]
    {
      flex: 0 0 auto;
      position:relative;
    }
    div[multilevelContainer]
    {
      width:calc(100% + 50px);
      padding-left:25px;
      padding-right:30px;
      margin-left:-15px;
      padding-top:1em;
      padding-bottom:1em;
      flex: 1 1 auto;
      overflow-x:hidden;
      overflow-y:auto;
    }
    [selectionSummary]
    {
      margin-left:1.0em;
      margin-bottom:0.5em;
      height:35px;
    }
    `
  ],
  providers : [ MultilevelProvider ]
})

export class NehubaUIControl implements OnChanges{
  @Input() searchTerm : string = ''

  constructor(public mainController:MainController,public multilevelProvider:MultilevelProvider){

  }

  ngOnChanges(){
    this.multilevelProvider.searchTerm = this.searchTerm
  }

  showMoreInfo(_item:any):void{
    // console.log(_item)
    const modalHandler = <ModalHandler>UI_CONTROL.modalControl.getModalHandler()
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