import { Directive, EventEmitter, Inject, OnDestroy, Optional, Output } from "@angular/core";
import { merge, Observable, of, Subscription } from "rxjs";
import { catchError, map, mapTo, switchMap } from "rxjs/operators";
import { BsRegionInputBase } from "../bsRegionInputBase";
import { REGISTERED_FEATURE_INJECT_DATA } from "../constants";
import { BsFeatureService, TFeatureCmpInput } from "../service";
import { IBSSummaryResponse, IRegionalFeatureReadyDirective } from "../type";

@Directive({
  selector: '[bs-features-receptor-directive]',
  exportAs: 'bsFeatureReceptorDirective'
})

export class BsFeatureReceptorDirective extends BsRegionInputBase implements IRegionalFeatureReadyDirective, OnDestroy {
  
  private sub: Subscription[] = []

  ngOnDestroy(){
    while (this.sub.length > 0) this.sub.pop().unsubscribe()
  }
  public results$: Observable<IBSSummaryResponse['ReceptorDistribution'][]>  = this.region$.pipe(
    switchMap(() => merge(
      of([]),
      this.getFeatureInstancesList('ReceptorDistribution').pipe(
        catchError(() => of([]))
      )
    )),
  )

  public hasReceptor$ = this.results$.pipe(
    map(arr => arr.length > 0)
  )

  public busy$ = this.region$.pipe(
    switchMap(() => merge(
      of(true),
      this.results$.pipe(
        mapTo(false)
      )
    ))
  )
  
  constructor(
    svc: BsFeatureService,
    @Optional() @Inject(REGISTERED_FEATURE_INJECT_DATA) data: TFeatureCmpInput,
  ){
    super(svc, data)
    this.sub.push(
      this.busy$.subscribe(flag => this.fetchingFlagEmitter.emit(flag))
    )
  }

  @Output('bs-features-receptor-directive-fetching-flag')
  public fetchingFlagEmitter = new EventEmitter<boolean>()
}