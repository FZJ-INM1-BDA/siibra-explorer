import { Component } from "@angular/core";


@Component({
  selector : 'layouts-example',
  templateUrl : './layoutsExample.template.html',
  styleUrls : [
    `./layoutsExample.style.css`
  ]
})

export class LayoutsExample{
  mainsideOverlay : boolean = true
  mainsideShowSide : boolean = true
  mainsideSideWidth : number = 100
}