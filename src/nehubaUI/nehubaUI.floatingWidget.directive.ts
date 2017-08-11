import { Directive, ViewContainerRef } from '@angular/core'

@Directive({
      selector : '[floating-widget-host]'
})
export class FloatingWidgetDirective{
      constructor(public viewContainerRef:ViewContainerRef){}
}