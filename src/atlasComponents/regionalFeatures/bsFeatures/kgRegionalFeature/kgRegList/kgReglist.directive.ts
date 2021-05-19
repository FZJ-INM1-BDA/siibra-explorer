import { Directive, OnDestroy } from "@angular/core";
import { TBSSummary } from "../type";
import { BsFeatureService } from "../../service";
import { BsRegionInputBase } from "../../bsRegionInputBase";
import { Subscription } from "rxjs";
import { filter, startWith, switchMap, tap } from "rxjs/operators";

@Directive({
  selector: '[kg-regional-features-list-directive]',
  exportAs: 'kgRegionalFeaturesListDirective'
})

export class KgRegionalFeaturesListDirective extends BsRegionInputBase implements OnDestroy {
  public kgRegionalFeatures: TBSSummary[] = []
  public kgRegionalFeatures$ = this.region$.pipe(
    filter(v => !!v),
    // must not use switchmapto here
    switchMap(() => this.getFeatureInstancesList('KgRegionalFeature')),
    startWith([])
  )
  constructor(svc: BsFeatureService){
    super(svc)
    this.sub.push(
      this.kgRegionalFeatures$.subscribe(val => {
        this.kgRegionalFeatures = val
      })
    )
  }
  private sub: Subscription[] = []
  ngOnDestroy(){
    while (this.sub.length) this.sub.pop().unsubscribe()
  }
}