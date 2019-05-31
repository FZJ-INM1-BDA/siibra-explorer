import { Directive, ViewContainerRef } from "@angular/core";
import { WidgetServices } from "src/atlasViewer/widgetUnit/widgetService.service";


@Directive({
  selector: '[dockedContainerDirective]'
})

export class DockedContainerDirective{
  constructor(
    widgetService: WidgetServices,
    viewContainerRef: ViewContainerRef
  ){
    widgetService.dockedContainer = viewContainerRef
  }
}