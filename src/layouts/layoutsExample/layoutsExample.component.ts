import { Component } from "@angular/core";

@Component({
  selector : 'layouts-example',
  templateUrl : './layoutsExample.template.html',
  styleUrls : [
    `./layoutsExample.style.css`,
  ],
})

export class LayoutsExample {
  public mainsideOverlay: boolean = true
  public mainsideShowSide: boolean = true
  public mainsideSideWidth: number = 100
}
