import { Component, HostBinding, Input, ViewChild } from "@angular/core";

@Component({
  selector : 'layout-floating-container',
  templateUrl : './floating.template.html',
  styleUrls : [
    `./floating.style.css`,
  ],
})

export class FloatingLayoutContainer {
  @HostBinding('style.z-index')
  @Input()
  public zIndex: number = 5
}
