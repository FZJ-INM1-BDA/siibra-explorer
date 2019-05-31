import { Component, ElementRef, OnDestroy, HostBinding } from "@angular/core";


@Component({
  templateUrl : `./pluginUnit.template.html`
})

export class PluginUnit implements OnDestroy{
  
  elementRef:ElementRef
  
  @HostBinding('attr.pluginContainer')
  pluginContainer = true

  constructor(er:ElementRef){
    this.elementRef = er
  }

  ngOnDestroy(){
    if (!PRODUCTION)
      console.log('plugin being destroyed')
  }

}