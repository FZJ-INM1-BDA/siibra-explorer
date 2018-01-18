import { Component } from '@angular/core'
import { HelperFunctions, PLUGIN_CONTROL as gPluginControl } from 'nehubaUI/nehubaUI.services';
import { LabComponent, LabComponentHandler } from 'nehubaUI/nehuba.model';

@Component({
  selector : 'lab',
  template : 
  `
  <div id = "labContainer">
    <div *ngFor = "let plugin of plugins" (click)="launchPlugin(plugin)" class = "btn btn-default">
      {{plugin.name.split('.')[plugin.name.split('.').length-1]}}
    </div>
  </div>
  `
})

export class Lab {

  advancedMode = {
    name : "fzj.xg.advancedMode",
    templateURL:"http://172.104.156.15/cors/html/advancedMode",
    scriptURL:"http://172.104.156.15/cors/js/advancedMode"
  }

  uix = {
    "name":"fzj.xg.uix",
    "type":"plugin",
    "templateURL":"http://172.104.156.15/cors/html/nehuba_ui_extension",
    "scriptURL":"http://172.104.156.15/cors/js/nehuba_ui_extension"
  }

  jugex = {
    name : 'fzj.xg.jugex',
    templateURL:'http://172.104.156.15/cors/html/jugex.template',
    scriptURL : 'http://172.104.156.15/cors/js/jugex.script'
  }

  papayaX = {
    "name":"fzj.xg.receptorBrowser",
    "type":"plugin",
    "templateURL":"http://172.104.156.15/cors/html/papayaX",
    "scriptURL":"http://172.104.156.15/cors/js/papayaX"
  }

  screenSaver = {
    "name":"fzj.xg.meshAnimator",
    "templateURL":"http://localhost:5080/meshAnimator/meshAnimator.html",
    "scriptURL":"http://localhost:5080/meshAnimator/meshAnimator.js"
  }

  builder = {
    "name":"fzj.xg.pluginBuilder",
    "icon":"console",
    "templateURL":"http://172.104.156.15/cors/html/pluginBuilder",
    "scriptURL":"http://172.104.156.15/cors/js/pluginBuilder"
  }
  
  experiment = {"name":"fzj.xg.localNifti","type":"plugin","templateURL":"http://localhost:5080/localNifti/localNifti.html","scriptURL":"http://localhost:5080/localNifti/localNifti.js"}

  constructor(){
    
  }

  plugins = [this.uix,this.screenSaver,this.papayaX,this.builder,this.experiment].map(item=>new LabComponent(item))

  appendPlugin(param:any){
    this.plugins.push(param)
  }

  /* TODO figure out a new way to launch plugin */
  launchPlugin(labComponent:LabComponent){
    if(gPluginControl[labComponent.name]){
      (<LabComponentHandler>gPluginControl[labComponent.name]).blink(10)
    }else{
      HelperFunctions.sLoadPlugin(labComponent)
    }
    // if(param.templateURL && param.scriptURL){
    //   const requestNewFloatingWidget = new EventPacket('floatingWidgetRelay',Date.now().toString(),100,{})
    //   const newSubject = this.eventCenter.createNewRelay(requestNewFloatingWidget)
    //   newSubject.next(new EventPacket('lab','',100,param))
    // }
  }
}
