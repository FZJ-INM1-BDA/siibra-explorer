import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from "@angular/common/http"
import { Injectable } from "@angular/core"
import { interval, merge, Observable, of, Subject, throwError, timer } from "rxjs"
import { catchError, filter, finalize, map, switchMapTo, take, takeWhile } from "rxjs/operators"

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
  req: HttpRequest<unknown>
  next: HttpHandler
}

@Injectable({
  providedIn: 'root'
})
export class PriorityHttpInterceptor implements HttpInterceptor{

  private retry = 0

  private priorityQueue: Queue[] = []

  private currentJob: Set<string> = new Set()
  private archive: Map<string, (HttpResponse<unknown>|Error)> = new Map()
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
          if (--retry >= 0) {
            return obs
          }
          return of(new Error(err))
        }),
      ).subscribe(val => {
        if (val instanceof Error) {
          this.archive.set(urlWithParams, val)
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

  private insert(obj: Queue) {
    const { urlWithParams, req } = obj
    
    if (this.archive.has(urlWithParams)) return
    if (this.currentJob.has(urlWithParams)) return

    obj.req = req.clone()

    const existing = this.priorityQueue.find(q => q.urlWithParams === urlWithParams)
    if (existing) {
      return
    }
    this.priorityQueue.push(obj)
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    /**
     * Do not use priority for requests other than get.
     * Since the way in which serialization occurs is via path and query param...
     * body is not used.
     */
    if (req.method !== 'GET') {
      return next.handle(req)
    }

    const { urlWithParams } = req
    const archive = this.archive.get(urlWithParams)
    if (archive) {
      if (archive instanceof Error) {
        return throwError(archive)
      }
      if (archive instanceof HttpResponse) {
        return of( archive.clone() )
      }
    }
    
    const objToInsert: Queue = {
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
        if (v['error'] instanceof Error) {
          throw v
        }
        return (v as Result<unknown>).result
      })
    )
  }
}
