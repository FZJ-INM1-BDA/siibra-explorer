import { Inject, Injectable, Optional } from "@angular/core";
import { concat, EMPTY, NEVER, Observable, of } from "rxjs";
import { delay, exhaustMap, shareReplay, switchMap, take, tap } from "rxjs/operators";
import { TNehubaViewerUnit } from "../constants";
import { NEHUBA_INSTANCE_INJTKN } from "../util";

@Injectable({
  providedIn: 'root'
})
export class NavigationBaseSvc{
  
  public nehubaViewerUnit$ = this.nehubaInst$
    ? this.nehubaInst$.pipe(
      switchMap(val => val ? of(val): EMPTY)
    )
    : NEVER

  public viewerNavLock$: Observable<boolean> = this.nehubaViewerUnit$.pipe(
    switchMap(nvUnit => 
      nvUnit.viewerPositionChange.pipe(
        exhaustMap(() => concat(
          of(true),
          concat(
            /**
             * in the event that viewerPositionChange only emits once (such is the case on init)
             */
            of(false),
            nvUnit.viewerPositionChange,
          ).pipe(
            switchMap(() => 
              of(false).pipe(
                delay(160)
              )
            ),
            take(1)
          ),
        ))
      )
    ),
    shareReplay(1),
  )
  constructor(
    @Optional() @Inject(NEHUBA_INSTANCE_INJTKN) private nehubaInst$: Observable<TNehubaViewerUnit>,
  ){
  }
}
