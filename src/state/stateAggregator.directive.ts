import { Directive } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { Observable } from "rxjs";
import { filter, map } from "rxjs/operators";

const jsonVersion = '1.0.0'
// ver 0.0.1 === query param

interface IJsonifiedState {
  ver: string
  queryString: any
}

@Directive({
  selector: '[iav-state-aggregator]',
  exportAs: 'iavStateAggregator'
})

export class StateAggregator{

  public jsonifiedSstate$: Observable<IJsonifiedState>
  constructor(
    router: Router
  ){
    this.jsonifiedSstate$ = router.events.pipe(
      filter(ev => ev instanceof NavigationEnd),
      map((ev: NavigationEnd) => {
        return {
          ver: jsonVersion,
          queryString: ev.urlAfterRedirects
        }
      })
    )
  }
}
