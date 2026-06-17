import { ComponentFactoryResolver, Directive, ViewContainerRef } from "@angular/core";
import { ViveTrackerSignal } from "./viveTrackerSignal/viveTrackerSignal.component";

@Directive({
  selector: '[vive-tracker-control-view-ref]'
})
export class ViveTrackerControlViewRef {
  constructor(
    private vcr: ViewContainerRef,
    private cfr: ComponentFactoryResolver,
  ) {
    const cf = this.cfr.resolveComponentFactory(ViveTrackerSignal)
    this.vcr.createComponent(cf)
  }
}
