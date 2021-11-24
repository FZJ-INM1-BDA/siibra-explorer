import { Directive, OnDestroy } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { Observable, Subscription } from "rxjs";
import { filter, map, startWith } from "rxjs/operators";

const jsonVersion = '1.0.0'
// ver 0.0.1 === query param

interface IJsonifiedState {
  ver: string
  hashPath: string
}

@Directive({
  selector: '[iav-state-aggregator]',
  exportAs: 'iavStateAggregator'
})

export class StateAggregator implements OnDestroy{

  public jsonifiedState: IJsonifiedState
  public jsonifiedState$: Observable<IJsonifiedState> = this.router.events.pipe(
    filter(ev => ev instanceof NavigationEnd),
    map((ev: NavigationEnd) => ev.urlAfterRedirects),
    startWith(this.router.url),
    map((path: string) => {
      return {
        ver: jsonVersion,
        hashPath: path
      }
    }),
  )
  constructor(
    private router: Router
  ){
    this.subscriptions.push(
      this.jsonifiedState$.subscribe(val => this.jsonifiedState = val)
    )
  }

  private subscriptions: Subscription[] = []
  ngOnDestroy(){
    while (this.subscriptions.length) this.subscriptions.pop().unsubscribe()
  }
}
