import { Injectable } from "@angular/core";
import { asyncScheduler, fromEvent } from "rxjs";
import { debounceTime, shareReplay, tap, throttleTime } from "rxjs/operators";

interface IThrottleConfig {
  leading: boolean
  trailing: boolean
}

@Injectable({
  providedIn: 'root'
})

export class ResizeObserverService {
  public windowResize = fromEvent(window, 'resize').pipe(
    shareReplay(1)
  )

  public getThrottledResize(time: number, config?: IThrottleConfig){
    return this.windowResize.pipe(
      throttleTime(time, asyncScheduler, config || { leading: false, trailing: true }),
    )
  }

  public getDebouncedResize(time: number) {
    return this.windowResize.pipe(
      debounceTime(time)
    )
  }
}
