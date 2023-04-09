import { Directive, Input, OnChanges, SimpleChanges } from "@angular/core";
import { BehaviorSubject, combineLatest, concat, merge, of, Subject } from "rxjs";
import { map, scan, shareReplay, switchMap } from "rxjs/operators";

@Directive({
  selector: '[feature-filter-directive]',
  exportAs: 'featureFilterDirective'
})
export class FeatureFilterDirective<T> implements OnChanges{
  @Input()
  items: T[] = []

  @Input()
  initValue = false

  #items$ = new BehaviorSubject<T[]>(this.items)
  #initValue$ = new BehaviorSubject<boolean>(this.initValue)
  #toggle$ = new Subject<{ target: T }>()
  #setValue$ = new Subject<{ target: T, flag: boolean}>()
  #setAll$ = new Subject<{ flag: boolean }>()

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.items) {
      this.#items$.next(changes.items.currentValue)
    }
    if (changes.initValue) {
      this.#initValue$.next(changes.initValue.currentValue)
    }
  }
  #checkbox$ = combineLatest([
    this.#items$,
    this.#initValue$
  ]).pipe(
    switchMap(([items, initFlag]) => {
      const initialCondition = items.map(item => ({ item, flag: initFlag }))
      return merge<{ target: T, flag?: boolean, op: string }>(
        this.#toggle$.pipe(
          map(v => ({ ...v, op: 'toggle' }))
        ),
        this.#setValue$.pipe(
          map(v => ({ ...v, op: 'set' }))
        ),
        this.#setAll$.pipe(
          map(v => ({ ...v, op: 'setAll' }))
        ),
        of({ op: 'noop' })
      ).pipe(
        scan((acc, { target, op, flag }) => {
          
          if (op === 'noop') return acc
          if (op === 'setAll') {
            return acc.map(({ item }) => ({ item, flag }))
          }
  
          const found = acc.find(({ item }) => item === target)
          const other = acc.filter(({ item }) => item !== target)
          const itemToAppend = found
            ? [{
              item: found.item,
              flag: op === 'set'
                ? flag
                : !found.flag
            }]
            : []
          return [ ...other, ...itemToAppend ]
        }, initialCondition)
      )
    }),
    shareReplay(1),
  )

  checked$ = concat(
    of([] as T[]),
    this.#checkbox$.pipe(
      map(arr => arr.filter(v => v.flag).map(v => v.item)),
    )
  )
  
  unchecked$ = concat(
    of([] as T[]),
    this.#checkbox$.pipe(
      map(arr => arr.filter(v => !v.flag).map(v => v.item)),
    )
  )

  toggle(target: T){
    this.#toggle$.next({ target })
  }
  setValue(target: T, flag: boolean) {
    this.#setValue$.next({ target, flag })
  }
  setAll(flag: boolean){
    this.#setAll$.next({ flag })
  }
}
