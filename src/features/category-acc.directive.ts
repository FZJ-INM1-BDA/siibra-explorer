import { AfterContentInit, ContentChildren, Directive, OnDestroy, QueryList } from '@angular/core';
import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { ListComponent } from './list/list.component';
import { Feature } from "src/atlasComponents/sapi/sxplrTypes"

@Directive({
  selector: '[sxplrCategoryAcc]',
  exportAs: 'categoryAcc'
})
export class CategoryAccDirective implements AfterContentInit, OnDestroy {

  public isBusy$ = new BehaviorSubject<boolean>(false)
  public total$ = new BehaviorSubject<number>(0)
  public features$ = new BehaviorSubject<Feature[]>([])

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
        listCmp.map(listC => listC.features$)
      ).subscribe(features => this.features$.next(features.flatMap(f => f))),
      
      combineLatest(
        listCmp.map(listC => listC.features$)
      ).pipe(
        map(features => features.reduce((acc, curr) => acc + curr.length, 0))
      ).subscribe(total => this.total$.next(total)),

      combineLatest(
        listCmp.map(listC => listC.state$)
      ).pipe(
        map(states => states.some(state => state === "busy"))
      ).subscribe(flag => this.isBusy$.next(flag))
    )
  }
}
