import { AfterContentInit, ContentChildren, Directive, OnDestroy, QueryList } from '@angular/core';
import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { ListComponent } from './list/list.component';

@Directive({
  selector: '[sxplrCategoryAcc]',
  exportAs: 'categoryAcc'
})
export class CategoryAccDirective implements AfterContentInit, OnDestroy {

  constructor() { }

  public isBusy$ = new BehaviorSubject<boolean>(false)
  public total$ = new BehaviorSubject<number>(0)

  @ContentChildren(ListComponent, { read: ListComponent, descendants: true })
  listCmps: QueryList<ListComponent>

  #changeSub: Subscription
  ngAfterContentInit(): void {
    this.#registerListCmps()
    this.#changeSub = this.listCmps.changes.subscribe(() => this.#registerListCmps())
  }

  ngOnDestroy(): void {
    this.#cleanup()
  }

  #subscriptions: Subscription[] = []
  #cleanup(){
    if (this.#changeSub) this.#changeSub.unsubscribe()
    while(this.#subscriptions.length > 0) this.#subscriptions.pop().unsubscribe()
  }
  #registerListCmps(){
    this.#cleanup()

    const listCmp = Array.from(this.listCmps)

    this.#subscriptions.push(  
      combineLatest(
        listCmp.map(listCmp => listCmp.features$)
      ).pipe(
        map(features => features.reduce((acc, curr) => acc + curr.length, 0))
      ).subscribe(total => this.total$.next(total)),

      combineLatest(
        listCmp.map(listCmp => listCmp.state$)
      ).pipe(
        map(states => states.some(state => state === "busy"))
      ).subscribe(flag => this.isBusy$.next(flag))
    )
  }
}
