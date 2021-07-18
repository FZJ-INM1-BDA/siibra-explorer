import { Injectable } from "@angular/core";
import { select } from "@ngrx/store";
import { ReplaySubject, Subject } from "rxjs";
import { shareReplay } from "rxjs/operators";

export class LockError extends Error{}

/**
 * polyfill for ngrx component store
 * until upgrade to v11
 * where component store becomes generally available
 */

@Injectable()
export class ComponentStore<T>{
  private _state$: Subject<T> = new ReplaySubject<T>(1)
  private _lock: boolean = false
  get isLocked() {
    return this._lock
  }
  setState(state: T){
    if (this.isLocked) throw new LockError('State is locked')
    this._state$.next(state)
  }
  select<V>(selectorFn: (state: T) => V) {
    return this._state$.pipe(
      select(selectorFn),
      shareReplay(1),
    )
  }
  getLock(): () => void {
    if (this.isLocked) throw new LockError('Cannot get lock. State is locked')
    this._lock = true
    return () => this._lock = false
  }
}
