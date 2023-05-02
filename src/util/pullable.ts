import { DataSource } from "@angular/cdk/collections"
import { BehaviorSubject, Observable, ReplaySubject, Subscription, combineLatest, concat, of, pipe } from "rxjs"
import { finalize, map, scan, shareReplay, startWith, tap } from "rxjs/operators"

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


/**
 * Modifed Datasource
 * Allowing pull driven datasource
 * With backwards compatibility with original datasource.
 */
export class PulledDataSource<T> extends DataSource<T> {

  protected annotations: Record<string, string>

  protected onPulled() {
    return pipe(
    )
  }

  #pull: () => Promise<T[]>
  
  completed = false
  private _data = new ReplaySubject<T[]>()
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


  async pull(): Promise<T[]> {
    if (this.completed) {
      return []
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
      return []
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
    return this._data.pipe(
      startWith([] as T[]),
      scan((acc, curr) => [...acc, ...curr]),
      tap((v: T[]) => {
        this.currentValue = v
      }),
    )
  }
  complete() {
    this.completed = true
    // must assign final value synchronously
    this.finalValue = this.currentValue || []
    this._data.complete()
  }
  disconnect(): void {
    
  }
}

export class ParentDatasource<T> extends PulledDataSource<T> {

  #subscriptions: Subscription[] = []
  _children: PulledDataSource<T>[] = []
  constructor(arg: PaginatedArg<T>){
    super({ pull: async () => [], annotations: arg.annotations })
    const { children } = arg
    this._children = children
  }

  async pull() {
    for (const ds of this._children) {
      if (!ds.completed) {
        return await ds.pull()
      }
    }
    return []
  }

  connect(): Observable<readonly T[]> {
    if (this._children.length === 0) {
      return of([] as T[])
    }

    this.#subscriptions.push(
      combineLatest(this._children.map(c => c.isPulling$)).subscribe(flags => {
        this.isPulling = flags.some(flag => flag)
      })
    )

    return concat(
      ...this._children.map(ds => ds.connect())
    ).pipe(
      map(arr => {
        const alreadyEmitted = this._children.filter(c => c.completed)
        const prevValues = alreadyEmitted.flatMap(v => v.finalValue)
        return [...prevValues, ...arr]
      }),
      
      tap((v: T[]) => {
        this.currentValue = v
      }),
      finalize(() => {
        this.finalValue = this.currentValue || []
      })
    )
  }

  disconnect(): void {
    super.disconnect()
    while (this.#subscriptions.length > 0) this.#subscriptions.pop().unsubscribe()
  }
}
