import { Component, ElementRef, HostBinding } from "@angular/core";

@Component({
  templateUrl : `./pluginUnit.template.html`,
})

export class PluginUnit {

  @HostBinding('attr.pluginContainer')
  public pluginContainer = true

  constructor(public elementRef: ElementRef) {

  }
}
