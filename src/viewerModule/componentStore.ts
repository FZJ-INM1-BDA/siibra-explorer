import { Injectable } from "@angular/core";
import { select } from "@ngrx/store";
import { ReplaySubject, Subject } from "rxjs";
import { shareReplay } from "rxjs/operators";

/**
 * polyfill for ngrx component store
 * until upgrade to v11
 * where component store becomes generally available
 */

@Injectable()
export class ComponentStore<T>{
  private _state$: Subject<T> = new ReplaySubject<T>(1)
  setState(state: T){
    this._state$.next(state)
  }
  select(selectorFn: (state: T) => unknown) {
    return this._state$.pipe(
      select(selectorFn),
      shareReplay(1),
    )
  }
}
