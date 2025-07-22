import { CollectionViewer, DataSource } from "@angular/cdk/collections"
import { BehaviorSubject, Observable, Subscription, combineLatest, from, merge } from "rxjs"
import { map, shareReplay, switchMap, take } from "rxjs/operators"
import { waitFor } from "./fn"

interface NPaginatedArg<T> {
  getPage: (pageNo: number) => Promise<T[]>
  perPage: number
  init: (ds: CustomDataSource<T>) => Promise<void>
  annotations?: Record<string, string>
}

export class CustomDataSource<T> extends DataSource<T> {
  
  #cachedResult: T[] = []
  #fetchedPages = new Set()
  initFlag = false

  total$ = new BehaviorSubject(0)
  #total = 0
  get total(){
    return this.#total
  }
  set total(val: number) {
    if (val === this.#total) {
      return
    }
    this.#total = val
    this.total$.next(val)
    this.#cachedResult = Array.from({ length: this.#total })
    this.#fetchedPages.clear()
  }

  annotations: Record<string, string> = {}

  #getPage: (page: number) => Promise<T[]>
  #perPage = 50
  #subscription = new Subscription()
  constructor(arg?: NPaginatedArg<T>){
    super()
    const { getPage, perPage, init, annotations } = arg || { init: async () => null }
    let missingParam = true
    if (getPage && perPage) {
      this.#getPage = getPage
      this.#perPage = perPage
      missingParam = false
    }
    this.isBusy$.next(true)
    init(this).then(() => {
      this.initFlag = true
      this.isBusy$.next(false)
    })
    this.annotations = annotations || {}

    if (missingParam) {
      throw new Error(`getRange or (getPage && perPage) method must be provided for PulledDataSource`)
    }
  }
  #datastream = new BehaviorSubject<T[]>(this.#cachedResult)
  isBusy$ = new BehaviorSubject(false)
  connect(collectionViewer: CollectionViewer): Observable<readonly T[]> {
    this.#subscription.add(
      collectionViewer.viewChange.subscribe(async ({ start, end }) => {
        if (start === end) {
          return
        }
        const [sp, ep] = this.#getPageNos(start, end)
        for (let i = sp; i <= ep; i ++){
          this.#execGetPage(i)
        }
      })
    )
    return this.#datastream
  }
  disconnect(): void {
    this.#subscription.unsubscribe()
  }

  #getPageNos(start: number, end: number){
    if (end <= start) {
      throw new Error(`end must be > start, but ${end} <= ${start}`)
    }
    const startPage = Math.floor(start / this.#perPage) + 1
    const endPage = Math.floor((end - 1) / this.#perPage) + 1
    return [startPage, endPage]
  }

  async #execGetPage(page: number) {

    if (this.#fetchedPages.has(page)) {
      return
    }
    this.isBusy$.next(true)
    const items = await this.#getPage(page)

    // total must be set before this
    // give caller a chance to set total
    this.#cachedResult.splice(
      (page - 1) * this.#perPage,
      this.#perPage,
      ...items
    )
    this.#datastream.next(this.#cachedResult)
    this.#fetchedPages.add(page)
    this.isBusy$.next(false)
  }

  /**
   * @description Heavy operation. Eagerly gets all features, and emit once and once only.
   */
  pullAll(){
    const observable = new Observable<(T|null)[]>(obs => {
      waitFor(() => this.initFlag)
        .then(() => {
          const pages: number[] = []
          const totalPage = Math.ceil(this.total / this.#perPage)
          for (let i = 1; i <= totalPage; i++ ){
            pages.push(i)
          }
          if (pages.length === 0) {
            obs.next([])
            obs.complete()
            return
          }
          merge(
            ...pages.map(async page => await this.#execGetPage(page))
          ).pipe(
          ).subscribe({
            next: () => obs.next(this.#cachedResult),
            complete: () => obs.complete()
          })
        })
    })

    return observable
  }

  async getRange(start: number, end: number){
    if (start === end) {
      return []
    }
    const [sp, ep] = this.#getPageNos(start, end)
    const allPr: Promise<void>[] = []
    for (let i = sp; i <= ep; i ++){
      allPr.push(
        this.#execGetPage(i)
      )
    }
    await Promise.all(allPr)
    return this.#cachedResult.slice(start, end)
  }
}

export class ParentCustomDataSource<T> extends DataSource<T> {
  #datastream = new BehaviorSubject<T[]>([])
  #subscription = new Subscription()
  total = 0
  initFlag = false
  total$ = combineLatest(
    this.children.map(c => c.total$),
  ).pipe(
    map(values => values.reduce((acc, curr) => acc + curr, 0)),
    shareReplay(1),
  )
  isBusy$ = combineLatest(this.children.map(c => c.isBusy$)).pipe(
    map(flags => flags.some(f => f))
  )
  constructor(private children: CustomDataSource<T>[]){
    super()
    this.init()
  }
  connect(collectionViewer: CollectionViewer): Observable<readonly T[]> {
    this.#subscription.add(
      collectionViewer.viewChange.subscribe(async range => {
        const { start, end } = range
        await waitFor(() => this.children.every(c => c.initFlag))

        const data = Array.from<T>({ length: this.total })
        let seekIndex = start
        let currIndex = 0
        let breakflag = false

        for (const c of this.children){
          if (breakflag) {
            continue
          }
          if ((currIndex + c.total) < seekIndex ) {
            currIndex += c.total
            continue
          }

          const startIdx = seekIndex - currIndex
          let endIdx = end - currIndex
          if (endIdx <= c.total) {
            breakflag = true
          } else {
            endIdx = c.total
          }

          const insertIdx = seekIndex
          const deleteCount = endIdx - startIdx

          
          c.getRange(
            startIdx,
            endIdx
          ).then(arr => {
            data.splice(insertIdx, deleteCount, ...arr)
            this.#datastream.next(data)
          })

          currIndex += c.total
          seekIndex = currIndex
        }
      })
    )
    return from(waitFor(() => this.initFlag)).pipe(
      switchMap(() => this.#datastream)
    )
  }
  disconnect(): void {
    this.#subscription.unsubscribe()
  }

  /**
   * @description Heavy operation. Eagerly gets all features
   */
  pullAll(){
    return combineLatest(
      this.children.map(c => c.pullAll().pipe(
      ))
    ).pipe(
      map(arrofarr => arrofarr.flatMap(v => v)),
    )
  }

  async init(){
    await waitFor(() => this.children.every(c => c.initFlag))
    this.total = await this.total$.pipe(
      take(1)
    ).toPromise()
    this.#datastream.next(Array.from({ length: this.total }))
    this.initFlag = true
  }
}
