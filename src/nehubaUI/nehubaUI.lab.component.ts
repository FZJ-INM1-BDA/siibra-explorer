import { Component } from '@angular/core'
import { EventCenter } from './nehubaUI.services'
import { EventPacket,LabComponent } from './nehuba.model'

@Component({
      selector : 'lab',
      template : `
<div id = "labContainer">
      <div (click)="discoParcel()" class = "btn btn-default">
            <span class = "glyphicon glyphicon-lamp"></span>JuGeX
      </div>
</div>
      `
})

export class Lab {

      labComponentsCollection : LabComponent[]
      constructor(private eventCenter:EventCenter){

      }
      discoParcel(){
            const requestNewFloatingWidget = new EventPacket('floatingWidgetRelay',Date.now().toString(),100,{})
            const newSubject = this.eventCenter.createNewRelay(requestNewFloatingWidget)
            if( newSubject ){
                  newSubject.next(new EventPacket('lab','',100,{
                        templateURL:'http://172.104.156.15/html/jugex.template',
                        scriptURL : 'http://172.104.156.15/js/jugex.script'
                  }))
            }
      }
}

