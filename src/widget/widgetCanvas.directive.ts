import { Directive, ViewContainerRef } from "@angular/core";
import { WidgetService } from "./service";

@Directive({
  selector: `[widget-canvas]`
})

export class WidgetCanvas {
  constructor(
    wSvc: WidgetService,
    vcr: ViewContainerRef,
  ){
    wSvc.vcr = vcr
  }
}
