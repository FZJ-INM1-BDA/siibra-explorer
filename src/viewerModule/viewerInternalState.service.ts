import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

export const AUTO_ROTATE = `[special] autoRotate`
export type TAutoRotatePayload = {
  play: boolean
  speed?: number
  reverse?: boolean
}

export type TInteralStatePayload<TPayloadShape> = {
  '@type': 'TViewerInternalStateEmitterEvent'
  '@id': string
  viewerType: string
  payload: TPayloadShape
}

type TViewerInternalStateEmitter = {
  '@type': 'TViewerInternalStateEmitter'
  viewerType: string
  applyState: <T>(arg: TInteralStatePayload<T>) => void
}

type TEmitterCallbacks<TPayloadShape> = {
  next: (arg: TInteralStatePayload<TPayloadShape>) => void
  done: () => void
}

@Injectable()
export class ViewerInternalStateSvc{

  public viewerInternalState$ = new BehaviorSubject<TInteralStatePayload<any>>(null)

  private registeredEmitter: TViewerInternalStateEmitter

  applyInternalState<T>(arg: TInteralStatePayload<T>): void{
    if (!this.registeredEmitter) {
      throw new Error(`No emitter registered. Aborting.`)
    }
    this.registeredEmitter.applyState(arg)
  }

  registerEmitter<T>(emitter: TViewerInternalStateEmitter): TEmitterCallbacks<T>{
    this.registeredEmitter = emitter
    return {
      next: arg => {
        this.viewerInternalState$.next(arg)
      },
      done: () => this.deregisterEmitter(emitter)
    }
  }
  deregisterEmitter(emitter: TViewerInternalStateEmitter): void{
    if (emitter === this.registeredEmitter) {
      this.viewerInternalState$.next(null)
      this.registeredEmitter = null
    }
  }
}