import { Directive, EventEmitter, OnDestroy, Output } from "@angular/core";
import { KG_REGIONAL_FEATURE_KEY, TBSSummary } from "../type";
import { BsFeatureService } from "../../service";
import { BsRegionInputBase } from "../../bsRegionInputBase";
import { merge, of, Subscription } from "rxjs";
import { filter, mapTo, startWith, switchMap, tap } from "rxjs/operators";
import { IRegionalFeatureReadyDirective } from "../../type";

@Directive({
  selector: '[kg-regional-features-list-directive]',
  exportAs: 'kgRegionalFeaturesListDirective'
})

export class KgRegionalFeaturesListDirective extends BsRegionInputBase implements IRegionalFeatureReadyDirective, OnDestroy {
  public kgRegionalFeatures: TBSSummary[] = []
  public kgRegionalFeatures$ = this.region$.pipe(
    filter(v => !!v),
    // must not use switchmapto here
    switchMap(() => {
      this.busyEmitter.emit(true)
      return this.getFeatureInstancesList(KG_REGIONAL_FEATURE_KEY).pipe(
        tap(() => {
          this.busyEmitter.emit(false)
        })
      )
    }),
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

  results$ = this.kgRegionalFeatures$
  busy$ = this.region$.pipe(
    switchMap(() => merge(
      of(true),
      this.results$.pipe(
        mapTo(false)
      )
    ))
  )

  @Output('kg-regional-features-list-directive-busy')
  busyEmitter = new EventEmitter<boolean>()
}