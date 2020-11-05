import { Directive, Inject, EventEmitter, OnDestroy, Optional, Output } from "@angular/core";
import { take } from "rxjs/operators";
import { ClickInterceptor, CLICK_INTERCEPTOR_INJECTOR } from "src/util";
import { RegionalFeaturesService } from "./regionalFeature.service";

@Directive({
  selector: '[regional-feature-interactiviity]',
  exportAs: 'regionalFeatureInteractivity'
})

export class RegionalFeatureInteractivity implements OnDestroy{

  @Output('rf-interact-onclick-3d-landmark')
  onClick3DLandmark: EventEmitter<{ landmark: any, next: Function }> = new EventEmitter()

  private onDestroyCb: Function[] = []

  constructor(
    private regionalFeatureService: RegionalFeaturesService,
    @Optional() @Inject(CLICK_INTERCEPTOR_INJECTOR) private regClickIntp: ClickInterceptor,
  ){

    if (this.regClickIntp) {
      const { deregister, register } = this.regClickIntp
      const clickIntp = this.clickIntp.bind(this)
      register(clickIntp)
      this.onDestroyCb.push(() => {
        deregister(clickIntp)
      })
    }

  }

  ngOnDestroy(){
    while (this.onDestroyCb.length > 0) this.onDestroyCb.pop()()
  }

  private clickIntp(ev: any, next: Function) {
    let hoveredLandmark = null
    this.regionalFeatureService.onHoverLandmarks$.pipe(
      take(1)
    ).subscribe(val => {
      hoveredLandmark = val
    })
    if (hoveredLandmark) {
      this.onClick3DLandmark.emit({
        landmark: hoveredLandmark,
        next
      })
    } else {
      next()
    }
  }
}
