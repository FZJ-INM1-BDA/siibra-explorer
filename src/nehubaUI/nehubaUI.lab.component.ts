import { Component } from '@angular/core'
import { EventCenter } from './nehubaUI.services'
import { EventPacket } from './nehuba.model'

declare var window:{
      [key:string] : any
      prototype : Window;
      new() : Window;
}

@Component({
      selector : 'lab',
      template : `
<div id = "labContainer">
      <div (click)="discoParcel(jugex)" class = "btn btn-default">
            JuGeX
      </div>
      <div (click)="discoParcel(masterslave)" class = "btn btn-default">
            <i class = "glyphicon glyphicon-signal"></i> Remote Control
      </div>
</div>
      `
})

export class Lab {

      jugex = {
            name : 'JuGeX',
            templateURL:'http://172.104.156.15/html/jugex.template',
            scriptURL : 'http://172.104.156.15/js/jugex.script'
      }

      masterslave = {
            name : 'Remote Control',
            icon : 'signal',
            templateURL:'http://172.104.156.15/html/masterslave',
            scriptURL : 'http://172.104.156.15/js/masterslave'
      }
      constructor(private eventCenter:EventCenter){

      }
      discoParcel(param:any){
            if(param.templateURL && param.scriptURL){
                  if(window[param.name]){
                        window[param.name].next(new EventPacket('lab',Date.now().toString(),110,{blink:true}))
                  }else{
                        const requestNewFloatingWidget = new EventPacket('floatingWidgetRelay',Date.now().toString(),100,{})
                        const newSubject = this.eventCenter.createNewRelay(requestNewFloatingWidget)
                        newSubject.next(new EventPacket('lab','',100,param))
                  }
            }
      }
}
