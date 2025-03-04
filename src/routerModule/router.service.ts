import { Inject, Injectable } from "@angular/core";
import { NavigationEnd, Router } from '@angular/router'
import { distinctUntilChanged, filter, map, shareReplay, switchMap, take } from "rxjs/operators";
import { BehaviorSubject, merge } from 'rxjs'
import { scan } from 'rxjs/operators'
import { SAPI } from "src/atlasComponents/sapi";
import { DECODE_ENCODE, DecodeEncode } from "./util";


@Injectable({
  providedIn: 'root'
})

export class RouterService {

  private _customRoute$ = new BehaviorSubject<Record<string, string>>({})

  #navEnd$ = this.router.events.pipe(
    filter<NavigationEnd>(ev => ev instanceof NavigationEnd),
    shareReplay(1)
  )

  public customRoute$ = this.sapi.atlases$.pipe(
    filter(atlases => atlases.length > 0),
    take(1),
    switchMap(() => merge(
      this.#navEnd$.pipe(
        map((ev: NavigationEnd) => {
          const fullPath = ev.urlAfterRedirects
          const customState = this.decodeCustomState.decodeCustomState(
            this.router.parseUrl(fullPath)
          )
          return customState || {}
        }),
      ),
      this._customRoute$
    )),
    scan<Record<string, string>>((acc, curr) => {
      return {
        ...acc,
        ...curr
      }
    }, {}),
    distinctUntilChanged((o, n) => {
      if (Object.keys(o).length !== Object.keys(n).length) {
        return false
      }
      for (const key in o) {
        if (o[key] !== n[key]) return false
      }
      return true
    }),
    shareReplay(1)
  )

  setCustomRoute(key: string, state: string){
    if (!this.decodeCustomState.verifyCustomState(key)) {
      throw new Error(`custom state key must start with x- `)
    }
    this._customRoute$.next({
      [key]: state
    })
  }

  constructor(
    private router: Router,
    private sapi: SAPI,
    @Inject(DECODE_ENCODE)
    private decodeCustomState: DecodeEncode,
  ){
    /**
     * n.b. navEnd$ events cannot be missed
     * so we subscribe here. The stream captures the last emitted event with shareReplay
     */
    this.#navEnd$.subscribe()
  }
}
