import { Directive, ViewContainerRef } from "@angular/core";
import { ToolbarWidgetSvc } from "./toolbarWidget.service";

@Directive({
  selector: `toolbar-widget-host,[toolbar-widget-host]`,
  standalone: true
})

export class ToolbarWidgetHost{
  constructor(svc: ToolbarWidgetSvc, vcr: ViewContainerRef){
    svc.vcr = vcr
  }
}
