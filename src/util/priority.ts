import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http"
import { Injectable } from "@angular/core"
import { interval, merge, Observable, Subject, timer } from "rxjs"
import { filter, finalize, switchMap, switchMapTo, take } from "rxjs/operators"

export const PRIORITY_HEADER = 'x-sxplr-http-priority'

type PriorityReq = {
  urlWithParams: string
  priority: number
  req: HttpRequest<any>
  next: HttpHandler
}

@Injectable()
export class PriorityHttpInterceptor implements HttpInterceptor{

  private priorityQueue: PriorityReq[] = []

  private priority$: Subject<PriorityReq> = new Subject()

  private forceCheck$ = new Subject()

  private counter = 0
  private max = 6

  private shouldRun(){
    return this.counter <= this.max
  }

  constructor(){
    this.forceCheck$.pipe(
      switchMapTo(
        merge(
          timer(0),
          interval(16)
        ).pipe(
          filter(() => this.shouldRun())
        )
      )
    ).subscribe(() => {
      this.priority$.next(
        this.priorityQueue.pop()
      )
    })
  }

  updatePriority(urlWithParams: string, newPriority: number) {
    const foundIdx = this.priorityQueue.findIndex(v => v.urlWithParams === urlWithParams)
    if (foundIdx < 0) return false
    const [ item ] = this.priorityQueue.splice(foundIdx, 1)
    item.priority = newPriority

    this.insert(item)
    this.forceCheck$.next(true)
    return true
  }

  private insert(obj: PriorityReq) {
    const { priority } = obj
    const foundIdx = this.priorityQueue.findIndex(q => q.priority <= priority)
    const useIndex = foundIdx >= 0 ? foundIdx : this.priorityQueue.length
    this.priorityQueue.splice(useIndex, 0, obj)
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const { urlWithParams } = req
    
    const priority = Number(req.headers.get(PRIORITY_HEADER) || 0)
    const objToInsert: PriorityReq = {
      priority,
      req,
      next,
      urlWithParams
    }

    this.insert(objToInsert)
    this.forceCheck$.next(true)

    return this.priority$.pipe(
      filter(v => v.urlWithParams === urlWithParams),
      take(1),
      switchMap(({ next, req }) => {
        this.counter ++  
        return next.handle(req)
      }),
      finalize(() => {
        this.counter --
      }),
    )
  }
}