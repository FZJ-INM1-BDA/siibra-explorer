import { Directive, ViewContainerRef } from "@angular/core";
import { WidgetServices } from "src/widget";

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
