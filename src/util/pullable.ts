import { DataSource } from "@angular/cdk/collections"
import { BehaviorSubject, Observable, ReplaySubject, Subscription, combineLatest, concat, of, timer } from "rxjs"
import { finalize, map, scan, shareReplay, startWith, tap } from "rxjs/operators"
import { cachedPromise } from "./fn"

export interface IPuller<T> {
  next: (cb: (val: T) => void) => void
  complete: (cb: () => void) => void
}

interface PaginatedArg<T> {
  pull?: () => Promise<T[]>
  children?: PulledDataSource<T>[]
  annotations?: Record<string, string>
}

export class IsAlreadyPulling extends Error {}
export class DsExhausted extends Error {}


/**
 * Modifed Datasource
 * Allowing pull driven datasource
 * With backwards compatibility with original datasource.
 */
export class PulledDataSource<T> extends DataSource<T> {

  protected annotations: Record<string, string>

  #pull: () => Promise<T[]>
  
  completed = false
  private _data = new ReplaySubject<T[]>()
  data$ = this._data.pipe(
    startWith([] as T[]),
    scan((acc, curr) => [...acc, ...curr]),
    tap((v: T[]) => {
      this.currentValue = v
    }),
    shareReplay(1)
  )


  currentValue: T[] = []
  finalValue: T[] = []

  protected _isPulling = false
  protected _isPulling$ = new BehaviorSubject<boolean>(false)
  isPulling$ = this._isPulling$.pipe(
    shareReplay(1)
  )
  set isPulling(val: boolean) {
    this._isPulling = val
    this._isPulling$.next(val)
  }
  get isPulling(){
    return this._isPulling
  }

  @cachedPromise()
  async pull(): Promise<T[]> {
    if (this.completed) {
      throw new DsExhausted()
    }
    if (this.isPulling) {
      throw new IsAlreadyPulling(`PulledDataSource is already pulling`)
    }

    if (!this.#pull) {
      return []
    }
    this.isPulling = true
    const newResults = await this.#pull()
    this.isPulling = false
    if (newResults.length === 0) {
      this.complete()
    }
    this._data.next(newResults)
    return newResults
  }

  constructor(arg?: PaginatedArg<T>){
    super()
    const { pull, annotations } = arg || {}
    if (!pull) {
      throw new Error(`pull method must be provided for PulledDataSource`)
    }
    this.#pull = pull
    this.annotations = annotations
    
  }

  connect(): Observable<readonly T[]> {
    return this.data$
  }
  complete() {
    this.completed = true
    // must assign final value synchronously
    this.finalValue = this.currentValue || []
    this._data.complete()
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  disconnect(): void {}
}

export class ParentDatasource<T> extends PulledDataSource<T> {

  private _data$ = new BehaviorSubject<T[]>([])
  data$ = this._data$.pipe(
    shareReplay(1),
  )

  #subscriptions: Subscription[] = []
  _children: PulledDataSource<T>[] = []
  constructor(arg: PaginatedArg<T>){
    super({ pull: async () => [], annotations: arg.annotations })
    const { children } = arg
    this._children = children
  }

  set isPulling(val: boolean){
    throw new Error(`Cannot set isPulling for parent pullable`)
  }
  get isPUlling(){
    return this._children.some(c => c.isPulling)
  }

  @cachedPromise()
  async pull() {
    for (const ds of this._children) {
      if (!ds.completed) {
        return await ds.pull()
      }
    }
    throw new DsExhausted()
  }

  /**
   * 
   * @TODO ParentPullable connect() must be invoked, before the data$ stream become active
   * @returns {Observable} of all children features
   */
  connect(): Observable<readonly T[]> {
    if (this._children.length === 0) {
      return of([] as T[])
    }

    this.#subscriptions.push(
      concat(
        ...this._children.map(ds => ds.connect()),
        /**
         * final emitted value
         * in some circumstances, all children would have been completed. 
         * the first synchronous empty array flushes the current value
         * the second timed empty array completes the observable
         * 
         * Observable must not be completed synchronously, as this leads to the final value not emitted. 
         * 
         * @TODO rather than subscribe, turn this into pure observable
         * 
         */
        of([] as T[]).pipe(
          tap(() => this.finalValue = this.currentValue)
        ),
        timer(160).pipe(
          map(() => [] as T[])
        )
      ).pipe(
        map(arr => {
          const alreadyCompleted = this._children.filter(c => c.completed)
          const prevValues = alreadyCompleted.flatMap(v => v.finalValue)
          return [...prevValues, ...arr]
        }),
        finalize(() => {
          this._data$.complete()
        })
      ).subscribe(v => {
        this.currentValue = v
        this._data$.next(v)
      })
    )
    return this.data$
  }

  disconnect(): void {
    super.disconnect()
    while (this.#subscriptions.length > 0) this.#subscriptions.pop().unsubscribe()
  }
}
