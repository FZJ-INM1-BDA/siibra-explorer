import { AfterContentInit, ContentChildren, Directive, Input, OnDestroy, QueryList } from '@angular/core';
import { combineLatest, merge, of, Subject, Subscription } from 'rxjs';
import { distinctUntilChanged, map, scan, shareReplay, switchMap } from 'rxjs/operators';
import { ListDirective, TranslatedFeature } from './list/list.directive';
import { ParentDatasource, PulledDataSource } from 'src/util/pullable';
import { arrayEqual } from 'src/util/array';

export type FeatureMetadata = {
  meta: {
    displayName: string
    total: number
  }
}

@Directive({
  selector: '[sxplrCategoryAcc]',
  exportAs: 'categoryAcc'
})
export class CategoryAccDirective implements AfterContentInit, OnDestroy {
  
  #listCmps$ = new Subject<ListDirective[]>()
  
  public isBusy$ = this.#listCmps$.pipe(
    switchMap(cmps =>
      combineLatest(
        cmps.map(
          cmp => cmp.isBusy$
        )
      ).pipe(
        map(isBusyState => isBusyState.some(state => state))
      )
    )
  )
  public total$ = this.#listCmps$.pipe(
    switchMap(listCmps =>
      combineLatest(
        listCmps.map(cmp => cmp.total$)
      ).pipe(
        map(totals => totals.reduce((acc, curr) => acc + curr)),
      )
    ),
    shareReplay(1)
  )

  public featureMetadata$ = this.#listCmps$.pipe(
    switchMap(listcmps => {
      if (listcmps.length === 0) {
        return of([] as FeatureMetadata[])
      }
      return merge(
        ...listcmps.map(cmp =>
          cmp.total$.pipe(
            map(total => ({
              [cmp.displayName]: total
            }))
          )
        )
      ).pipe(
        scan((acc, curr) => {
          return {
            ...acc,
            ...curr
          }
        }, {} as Record<string, number>),
        map(record => {
          const returnVal: FeatureMetadata[] = []
          for (const key in record) {
            returnVal.push({
              meta: {
                displayName: key,
                total: record[key]
              }
            })
          }
          return returnVal
        })
      )
    })
  )

  @ContentChildren(ListDirective, { read: ListDirective, descendants: true })
  listCmps: QueryList<ListDirective>

  #unchecked$ = new Subject<FeatureMetadata[]>()
  unchecked$ = this.#unchecked$.pipe(
    distinctUntilChanged(
      arrayEqual((o, n) => o.meta.displayName === n.meta.displayName && o.meta.total === n.meta.total)
    )
  )

  @Input()
  set unchecked(val: FeatureMetadata[]){
    this.#unchecked$.next(val)
  }

  public datasource$ = combineLatest([
    this.unchecked$,
    this.#listCmps$,
  ]).pipe(
    switchMap(([ unchecked, listCmps ]) => {
      const hideFeatureNames = unchecked.map(c => c.meta.displayName)
      const filteredListCmps = listCmps.filter(cmp => !hideFeatureNames.includes(cmp.displayName))
      
      if (filteredListCmps.length === 0) {
        return of(
          new ParentDatasource({
            children: [] as PulledDataSource<TranslatedFeature>[]
          })
        )
      }
      return combineLatest(
        filteredListCmps.map(cmp => cmp.datasource$)
      ).pipe(
        map(dss => new ParentDatasource({ children: dss })),
      )
    })
  )

  #changeSub: Subscription
  ngAfterContentInit(): void {
    this.#changeSub = this.listCmps.changes.subscribe(() => {
      this.#listCmps$.next(
        Array.from(this.listCmps)
      )
    })
    this.#listCmps$.next(
      Array.from(this.listCmps)
    )
  }

  ngOnDestroy(): void {
    if (this.#changeSub) this.#changeSub.unsubscribe() 
  }
}
