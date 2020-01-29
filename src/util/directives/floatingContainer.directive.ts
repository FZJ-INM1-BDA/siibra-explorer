import { Directive, ViewContainerRef } from "@angular/core";
import { WidgetServices } from "src/atlasViewer/widgetUnit/widgetService.service";

@Directive({
  selector: '[floatingContainerDirective]',
})

export class FloatingContainerDirective {
  constructor(
    widgetService: WidgetServices,
    viewContainerRef: ViewContainerRef,
  ) {
    widgetService.floatingContainer = viewContainerRef
  }
}
