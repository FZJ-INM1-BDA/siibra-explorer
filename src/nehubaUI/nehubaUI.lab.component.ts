import { Component } from '@angular/core'
import { EventCenter } from './nehubaUI.services'
import { EventPacket } from './nehuba.model'

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
            let newSubject = this.eventCenter.createNewRelay()
            newSubject.next(new EventPacket('','',100,{title:'testing disco',layername:'balllllll'}))
      }
}