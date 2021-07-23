import { Directive, EventEmitter, Inject, OnDestroy, Optional, Output } from "@angular/core";
import { KG_REGIONAL_FEATURE_KEY, TBSSummary } from "../type";
import { BsFeatureService, TFeatureCmpInput } from "../../service";
import { BsRegionInputBase } from "../../bsRegionInputBase";
import { merge, of, Subscription } from "rxjs";
import { catchError, mapTo, startWith, switchMap, tap } from "rxjs/operators";
import { IRegionalFeatureReadyDirective } from "../../type";
import { REGISTERED_FEATURE_INJECT_DATA } from "../../constants";

@Directive({
  selector: '[kg-regional-features-list-directive]',
  exportAs: 'kgRegionalFeaturesListDirective'
})

export class KgRegionalFeaturesListDirective extends BsRegionInputBase implements IRegionalFeatureReadyDirective, OnDestroy {
  public kgRegionalFeatures: TBSSummary[] = []
  public kgRegionalFeatures$ = this.region$.pipe(
    // must not use switchmapto here
    switchMap(() => {
      this.busyEmitter.emit(true)
      return merge(
        of([]),
        this.getFeatureInstancesList(KG_REGIONAL_FEATURE_KEY).pipe(
          catchError(() => of([])),
          tap(() => {
            this.busyEmitter.emit(false)
          }),
        )
      )
    }),
    startWith([])
  )
  
  constructor(
    svc: BsFeatureService,
    @Optional() @Inject(REGISTERED_FEATURE_INJECT_DATA) data: TFeatureCmpInput,  
  ){
    super(svc, data)
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