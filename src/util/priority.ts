import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from "@angular/common/http"
import { Injectable } from "@angular/core"
import { interval, merge, Observable, of, Subject, timer } from "rxjs"
import { catchError, filter, finalize, map, switchMapTo, take, takeWhile } from "rxjs/operators"

export const PRIORITY_HEADER = 'x-sxplr-http-priority'

type ResultBase = {
  urlWithParams: string
}

type Result<T> = {
  result: HttpResponse<T>
} & ResultBase

type ErrorResult = {
  error: Error
} & ResultBase

type Queue = {
  urlWithParams: string
  priority: number
  req: HttpRequest<unknown>
  next: HttpHandler
}

export const DISABLE_PRIORITY_HEADER = 'x-sxplr-disable-priority'

@Injectable({
  providedIn: 'root'
})
export class PriorityHttpInterceptor implements HttpInterceptor{

  private retry = 5
  private disablePriority = false

  private priorityQueue: Queue[] = []

  private currentJob: Set<string> = new Set()
  private archive: Map<string, HttpResponse<unknown>> = new Map()
  private queue$: Subject<Queue> = new Subject()
  private result$: Subject<Result<unknown>> = new Subject()
  private error$: Subject<ErrorResult> = new Subject()

  private forceCheck$ = new Subject()

  private counter = 0
  private max = 6

  constructor(){
    this.forceCheck$.pipe(
      switchMapTo(
        merge(
          timer(0),
          interval(16)
        ).pipe(
          filter(() => this.counter < this.max),
          takeWhile(() => this.priorityQueue.length > 0)
        )
      )
    ).subscribe(() => {
      const job = this.priorityQueue.pop()
      if (!job) return
      this.currentJob.add(job.urlWithParams)
      this.queue$.next(job)
    })

    this.queue$.subscribe(({ next, req, urlWithParams }) => {
      this.counter ++
      let retry = this.retry
      next.handle(req).pipe(
        finalize(() => {
          this.counter --
        }),
        catchError((err, obs) => {
          if (retry >= 0) {
            retry --
            return obs
          }
          return of(new Error(err))
        }),
      ).subscribe(val => {
        if (val instanceof Error) {
          this.error$.next({
            urlWithParams,
            error: val
          })
        }
        if (val instanceof HttpResponse) {
          this.archive.set(urlWithParams, val)
          this.result$.next({
            urlWithParams,
            result: val
          })
        }
      })
    })
  }

  updatePriority(urlWithParams: string, newPriority: number) {
    
    if (this.currentJob.has(urlWithParams)) return

    const foundIdx = this.priorityQueue.findIndex(v => v.urlWithParams === urlWithParams)
    if (foundIdx < 0) return false
    const [ item ] = this.priorityQueue.splice(foundIdx, 1)
    item.priority = newPriority

    this.insert(item)
    this.forceCheck$.next(true)
    return true
  }

  private insert(obj: Queue) {
    const { priority, urlWithParams, req } = obj
    
    if (this.archive.has(urlWithParams)) return
    if (this.currentJob.has(urlWithParams)) return

    obj.req = req.clone({
      headers: req.headers.delete(PRIORITY_HEADER)
    })

    const existing = this.priorityQueue.find(q => q.urlWithParams === urlWithParams)
    if (existing) {
      if (existing.priority < priority) {
        this.updatePriority(urlWithParams, priority)
      }
      return
    }
    const foundIdx = this.priorityQueue.findIndex(q => q.priority <= priority)
    const useIndex = foundIdx >= 0 ? foundIdx : this.priorityQueue.length
    this.priorityQueue.splice(useIndex, 0, obj)
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    /**
     * Do not use priority for requests other than get.
     * Since the way in which serialization occurs is via path and query param...
     * body is not used.
     */
    if (this.disablePriority || req.method !== 'GET' || !!req.headers.get(DISABLE_PRIORITY_HEADER)) {
      const newReq = req.clone({
        headers: req.headers.delete(DISABLE_PRIORITY_HEADER)
      })
      return next.handle(newReq)
    }

    const { urlWithParams } = req
    if (this.archive.has(urlWithParams)) {
      return of(
        this.archive.get(urlWithParams).clone()
      )
    }
    
    const priority = Number(req.headers.get(PRIORITY_HEADER) || 0)
    const objToInsert: Queue = {
      priority,
      req,
      next,
      urlWithParams
    }

    this.insert(objToInsert)
    this.forceCheck$.next(true)

    return merge(
      this.result$,
      this.error$,
    ).pipe(
      filter(v => v.urlWithParams === urlWithParams),
      take(1),
      map(v => {
        if (v instanceof Error) {
          throw v
        }
        return (v as Result<unknown>).result
      })
    )
  }
}
