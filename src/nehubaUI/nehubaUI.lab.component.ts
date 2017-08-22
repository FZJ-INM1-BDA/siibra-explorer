import { Component } from '@angular/core'
import { EventCenter } from './nehubaUI.services'
import { EventPacket } from './nehuba.model'
import { DISCO_WIDGET } from './nehuba.config'

@Component({
      selector : 'lab',
      template : `
<div (click)="discoParcel()" class = "btn btn-default">
      <span class = "glyphicon glyphicon-lamp"></span>Disco Parcel
</div>
      `
})

export class Lab {
      constructor(private eventCenter:EventCenter){

      }
      discoParcel(){
            let requestNewFloatingWidget = new EventPacket('floatingWidgetRelay',Date.now().toString(),100,{})
            let newSubject = this.eventCenter.createNewRelay(requestNewFloatingWidget)
            if( newSubject ){
                  newSubject.next(new EventPacket('loadCustomFloatingWidget','',100,DISCO_WIDGET))
            }
      }
}