import { Component} from '@angular/core'
import { UI_CONTROL, MainController } from './nehubaUI.services'
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
      width:100%;
      flex-direction:column;
    }
    
    div[inputContainer],
    div[multilevelContainer]
    {
      margin-top:1em;
      margin-left:1em;
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
      padding-left:20px;
      padding-right:30px;
      margin-left:-15px;
      padding-top:1em;
      padding-bottom:1em;
      flex: 1 1 auto;
      overflow-x:hidden;
      overflow-y:auto;
      box-shadow:inset 0px 0px 3.5em -0.8em rgba(0,0,0,0.5);
    }
    `
  ]
})

export class NehubaUIControl{
  searchTerm : string = ''

  constructor(public mainController:MainController){

  }

  showMoreInfo(_item:any):void{
    // console.log(_item)
    const modalHandler = <ModalHandler>UI_CONTROL.modalControl.getModalHandler()
    modalHandler.title = `<h4>More information on ${_item.name}</h4>`
    modalHandler.body = _item.properties
    modalHandler.footer = null
    modalHandler.show()
  }
}


