import { ComponentFactoryResolver, Directive, ViewContainerRef } from "@angular/core";
import { LeapSignal } from "./leapSignal/leapSignal.component";

@Directive({
  selector: '[leap-control-view-ref]'
})
export class LeapControlViewRef {
  constructor(
    private vcr: ViewContainerRef,
    private cfr: ComponentFactoryResolver,
  ){
    const cf = this.cfr.resolveComponentFactory(LeapSignal)
    this.vcr.createComponent(cf)
  }
}
