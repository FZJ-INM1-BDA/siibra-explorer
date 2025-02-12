import { Inject, Injectable, Optional } from "@angular/core";
import { concat, EMPTY, NEVER, Observable, of, timer } from "rxjs";
import { distinctUntilChanged, map, shareReplay, switchMap } from "rxjs/operators";
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

  public viewerNavLock$ = this.nehubaViewerUnit$.pipe(
    switchMap(nvUnit => 
      nvUnit.viewerPositionChange.pipe(
        switchMap(() => concat(
          of(true),
          timer(160).pipe(
            map(() => false)
          )
        ))
      )
    ),
    distinctUntilChanged(),
    shareReplay(1),
  )

  constructor(
    @Optional() @Inject(NEHUBA_INSTANCE_INJTKN) private nehubaInst$: Observable<TNehubaViewerUnit>,
  ){
  }
}
