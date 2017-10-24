import { Component } from '@angular/core'
import { EventCenter } from './nehubaUI.services'
import { EventPacket } from './nehuba.model'

@Component({
      selector : 'lab',
      template : `
<div id = "labContainer">
      <div *ngFor = "let plugin of plugins" (click)="launchPlugin(plugin)" class = "btn btn-default">
            <span *ngIf = "plugin.icon" [ngClass]="'glyphicon-'+plugin.icon" class = "glyphicon"></span> {{plugin.name.split('.')[plugin.name.split('.').length-1]}}
      </div>
      <div (click)="showInputModal()" class = "btn btn-default">
            <span class = "glyphicon glyphicon-plus"></span>
      </div>
</div>
      `
})

export class Lab {

      advancedMode = {
            name : "fzj.xg.advancedMode",
            icon : "plus",
            templateURL:"http://localhost:81/html/advancedMode.html",
            scriptURL:"http://localhost:81/js/advancedMode.js"
      }

      uix = {
            "name":"fzj.xg.uix",
            "icon":"screenshot",
            "type":"plugin",
            "templateURL":"http://localhost:81/html/nehuba_ui_extension.html",
            "scriptURL":"http://localhost:81/js/nehuba_ui_extension.js"
      }

      jugex = {
            name : 'fzj.xg.jugex',
            templateURL:'http://localhost:81/html/jugex.template.html',
            scriptURL : 'http://localhost:81/js/jugex.script.js'
      }

      papayaX = {
            "name":"fzj.xg.papayaX",
            "icon":"info-sign",
            "type":"plugin",
            "templateURL":"http://localhost:81/html/papayaX.html",
            "scriptURL":"http://localhost:81/js/papayaX.js"
      }

      screenSaver = {
            "name":"fzj.xg.screenSaver",
            "templateURL":"http://localhost:81/html/screenSaver.html",
            "scriptURL":"http://localhost:81/js/screenSaver.js"
      }

      constructor(private eventCenter:EventCenter){
            
      }

      plugins = [this.uix,this.screenSaver,this.jugex,this.papayaX]

      appendPlugin(param:any){
            this.plugins.push(param)
      }

      launchPlugin(param:any){
            if(param.templateURL && param.scriptURL){
                  const requestNewFloatingWidget = new EventPacket('floatingWidgetRelay',Date.now().toString(),100,{})
                  const newSubject = this.eventCenter.createNewRelay(requestNewFloatingWidget)
                  newSubject.next(new EventPacket('lab','',100,param))
            }
      }

      showInputModal(){
            this.eventCenter.modalEventRelay.next(new EventPacket('showInputModal',Date.now().toString(),100,{title:'Add'}))
      }
}
