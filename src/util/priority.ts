import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from "@angular/common/http"
import { Injectable } from "@angular/core"
import { interval, merge, Observable, of, Subject, timer } from "rxjs"
import { filter, finalize, map, switchMapTo, take, takeWhile } from "rxjs/operators"

export const PRIORITY_HEADER = 'x-sxplr-http-priority'

type Result<T> = {
  urlWithParams: string
  result: HttpResponse<T>
}

type Queue = {
  urlWithParams: string
  priority: number
  req: HttpRequest<unknown>
  next: HttpHandler
}

@Injectable({
  providedIn: 'root'
})
export class PriorityHttpInterceptor implements HttpInterceptor{

  private disablePriority = false

  private priorityQueue: Queue[] = []

  private currentJob: Set<string> = new Set()
  private archive: Map<string, HttpResponse<unknown>> = new Map()
  private queue$: Subject<Queue> = new Subject()
  private result$: Subject<Result<unknown>> = new Subject()

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
          filter(() => this.counter <= this.max),
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
      next.handle(req).pipe(
        finalize(() => {
          this.counter --
        })
      ).subscribe(val => {
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
    
    if (this.disablePriority) {
      return next.handle(req)
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

    return this.result$.pipe(
      filter(v => v.urlWithParams === urlWithParams),
      take(1),
      map(v => v.result)
    )
  }
}