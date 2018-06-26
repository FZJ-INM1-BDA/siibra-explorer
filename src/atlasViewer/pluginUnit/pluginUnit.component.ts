import { Component, ElementRef, ViewChild, OnDestroy } from "@angular/core";


@Component({
  templateUrl : `./pluginUnit.template.html`
})

export class PluginUnit implements OnDestroy{
  
  @ViewChild('pluginContainer',{read:ElementRef}) 
  elementRef:ElementRef

  ngOnDestroy(){
    console.log('plugin being destroyed')
  }

}