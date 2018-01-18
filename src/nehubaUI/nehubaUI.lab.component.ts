import { Component } from '@angular/core'
import { HelperFunctions, PLUGIN_CONTROL as gPluginControl, TEMP_PLUGIN_DOMAIN as gTempPluginDomain } from 'nehubaUI/nehubaUI.services';
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

//   advancedMode = {
//     name : "fzj.xg.advancedMode",
//     templateURL:"http://172.104.156.15/cors/html/advancedMode",
//     scriptURL:"http://172.104.156.15/cors/js/advancedMode"
//   }

//   jugex = {
//     name : 'fzj.xg.jugex',
//     templateURL:'http://172.104.156.15/cors/html/jugex.template',
//     scriptURL : 'http://172.104.156.15/cors/js/jugex.script'
//   }

//   receptorBrowser = {
//     "name":"fzj.xg.receptorBrowser",
//     "type":"plugin",
//     "templateURL":"http://172.104.156.15/cors/html/receptorBrowser.html",
//     "scriptURL":"http://172.104.156.15/cors/js/receptorBrowser.js"
//   }


  screenSaver = {
    "name":"fzj.xg.meshAnimator",
    "templateURL":gTempPluginDomain + "html/meshAnimator.html",
    "scriptURL":gTempPluginDomain + "js/meshAnimator.js"
  }

//   builder = {
//     "name":"fzj.xg.pluginBuilder",
//     "icon":"console",
//     "templateURL":gTempPluginDomain + "/html/pluginBuilder.html",
//     "scriptURL":gTempPluginDomain + "/js/pluginBuilder.js"
//   }
  
  localNifti = {
        "name":"fzj.xg.localNifti",
        "type":"plugin",
        "templateURL":gTempPluginDomain + "/html/localNifti.html",
        "scriptURL":gTempPluginDomain + "/js/localNifti.js"
      }

  constructor(){
    
  }

  plugins = [this.screenSaver,this.localNifti].map(item=>new LabComponent(item))

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
