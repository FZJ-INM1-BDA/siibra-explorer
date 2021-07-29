import { Directive, Inject, OnDestroy, Optional } from "@angular/core";
import { merge, Observable, of, Subscription } from "rxjs";
import { catchError, mapTo, switchMap } from "rxjs/operators";
import { BsRegionInputBase } from "../bsRegionInputBase";
import { REGISTERED_FEATURE_INJECT_DATA } from "../constants";
import { BsFeatureService, TFeatureCmpInput } from "../service";
import { IBSSummaryResponse, IRegionalFeatureReadyDirective } from "../type";
import { SIIBRA_FEATURE_KEY } from './type'

@Directive({
  selector: '[bs-features-ieeg-directive]',
  exportAs: 'bsFeatureIeegDirective'
})

export class BsFeatureIEEGDirective extends BsRegionInputBase implements IRegionalFeatureReadyDirective, OnDestroy{

  public results$: Observable<IBSSummaryResponse['IEEG_Dataset'][]>  = this.region$.pipe(
    switchMap(() => this.getFeatureInstancesList(SIIBRA_FEATURE_KEY).pipe(
      catchError(() => of([]))
    )),
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
  }

  private sub: Subscription[] = []
  ngOnDestroy(){
    while(this.sub.length) this.sub.pop().unsubscribe()
  }
}
