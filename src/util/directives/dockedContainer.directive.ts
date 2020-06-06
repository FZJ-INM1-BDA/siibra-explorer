import { Directive, ViewContainerRef } from "@angular/core";
import { WidgetServices } from "src/widget";

@Directive({
  selector: '[dockedContainerDirective]',
})

export class DockedContainerDirective {
  constructor(
    widgetService: WidgetServices,
    viewContainerRef: ViewContainerRef,
  ) {
    widgetService.dockedContainer = viewContainerRef
  }
}
