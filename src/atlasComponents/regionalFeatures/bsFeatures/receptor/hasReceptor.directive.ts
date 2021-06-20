import { Directive, OnDestroy } from "@angular/core";
import { merge, of, Subscription } from "rxjs";
import { catchError, map, mapTo, switchMap } from "rxjs/operators";
import { BsRegionInputBase } from "../bsRegionInputBase";
import { BsFeatureReceptorService } from "./service";

@Directive({
  selector: '[bs-features-receptor-directive]',
  exportAs: 'bsFeatureReceptorDirective'
})

export class BsFeatureReceptorDirective extends BsRegionInputBase implements OnDestroy {
  
  private sub: Subscription[] = []

  ngOnDestroy(){
    while (this.sub.length > 0) this.sub.pop().unsubscribe()
  }

  public hasReceptor$ = this.region$.pipe(
    switchMap(val => merge(
      of(null),
      this.featureReceptorService.getReceptorRegionalFeature(val).pipe(
        map(arr => arr.length > 0),
        catchError(() => of(false))
      )
    )),
  )

  public fetching$ = this.hasReceptor$.pipe(
    map(v => v === null),
  )
  
  constructor(
    private featureReceptorService: BsFeatureReceptorService
  ){
    super()
  }
}