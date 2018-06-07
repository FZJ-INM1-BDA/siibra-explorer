import { Component, ViewChild, HostBinding, Input } from "@angular/core";


@Component({
  selector : 'layout-floating-container',
  templateUrl : './floating.template.html',
  styleUrls : [
    `./floating.style.css`
  ]
})

export class FloatingLayoutContainer{
  @HostBinding('style.z-index')
  @Input()
  zIndex : number = 5
}