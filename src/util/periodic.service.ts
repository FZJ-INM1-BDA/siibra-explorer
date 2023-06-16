import { Injectable } from "@angular/core";
import { Subject, combineLatest, interval, merge } from "rxjs";
import { filter, map, scan } from "rxjs/operators";
import { getUuid } from "./fn";

type Queue = {
  callback: () => boolean
  uuid: string
}

@Injectable({
  providedIn: 'root'
})
export class PeriodicSvc{
  #queue$ = new Subject<Queue>()
  #dequeue$ = new Subject<Queue>()
  #scannedQueue$ = merge<{ queue?: Queue, dequeue?: Queue }>(
    this.#queue$.pipe(
      map(queue => ({ queue })),
    ),
    this.#dequeue$.pipe(
      map(dequeue => ({ dequeue }))
    )
  ).pipe(
    scan((acc, curr) => {
      const { queue, dequeue } = curr
      if (queue) {
        return [...acc, queue]
      }
      if (dequeue) {
        return acc.filter(q => q.uuid !== dequeue.uuid)
      }
      console.warn(`neither queue nor dequeue were defined!`)
      return acc
    }, [] as Queue[])
  )

  addToQueue(callback: () => boolean){
    this.#queue$.next({ callback, uuid: getUuid() })
  }
  constructor(){
    combineLatest([
      this.#scannedQueue$,
      interval(160)
    ]).pipe(
      map(([queues, _]) => queues),
      filter(queues => queues.length > 0),
    ).subscribe(queues => {
      for (const queue of queues) {
        const { callback } = queue
        if (callback()) {
          this.#dequeue$.next(queue)
        }
      }
    })
  }
}
