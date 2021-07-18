import { Directive, EventEmitter, OnDestroy, Output } from "@angular/core";
import { merge, of, Subscription } from "rxjs";
import { catchError, map, mapTo, switchMap } from "rxjs/operators";
import { BsRegionInputBase } from "../bsRegionInputBase";
import { BsFeatureService } from "../service";

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
      this.getFeatureInstancesList('ReceptorDistribution').pipe(
        map(arr => arr.length > 0),
        catchError(() => of(false))
      )
    )),
  )

  public fetching$ = this.hasReceptor$.pipe(
    map(v => v === null),
  )
  
  constructor(
    svc: BsFeatureService
  ){
    super(svc)
    this.sub.push(
      this.fetching$.subscribe(flag => this.fetchingFlagEmitter.emit(flag))
    )
  }

  @Output('bs-features-receptor-directive-fetching-flag')
  public fetchingFlagEmitter = new EventEmitter<boolean>()
}