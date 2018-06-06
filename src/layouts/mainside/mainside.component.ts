import { Component, Input } from "@angular/core";


@Component({
  selector : 'layout-mainside',
  templateUrl : './mainside.template.html',
  styleUrls : [
    './mainside.style.css'
  ]
})

export class LayoutMainSide{
  @Input() showResizeSliver : boolean = true
  @Input() overlay : boolean = false
  @Input() showSide : boolean = false
  @Input() sideWidth : number = 300
}