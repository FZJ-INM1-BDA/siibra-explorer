import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

export type TInteralStatePayload<TPayloadShape> = {
  '@type': 'TViewerInternalStateEmitterEvent'
  '@id': string
  viewerType: string
  payload: TPayloadShape
}

type TViewerInternalStateEmitter<TPayloadShape> = {
  '@type': 'TViewerInternalStateEmitter'
  viewerType: string
  applyState: (arg: TInteralStatePayload<TPayloadShape>) => void
}

type TEmitterCallbacks<TPayloadShape> = {
  next: (arg: TInteralStatePayload<TPayloadShape>) => void
  done: () => void
}

@Injectable()
export class ViewerInternalStateSvc{

  public viewerInternalState$ = new BehaviorSubject<TInteralStatePayload<any>>(null)

  private registeredEmitter: TViewerInternalStateEmitter<any>

  applyInternalState(arg: TInteralStatePayload<any>){
    if (!this.registeredEmitter) {
      throw new Error(`No emitter registered. Aborting.`)
    }
    this.registeredEmitter.applyState(arg)
  }

  registerEmitter<T>(emitter: TViewerInternalStateEmitter<T>): TEmitterCallbacks<T>{
    this.registeredEmitter = emitter
    return {
      next: arg => {
        this.viewerInternalState$.next(arg)
      },
      done: () => this.deregisterEmitter(emitter)
    }
  }
  deregisterEmitter(emitter: TViewerInternalStateEmitter<any>){
    if (emitter === this.registeredEmitter) {
      this.viewerInternalState$.next(null)
      this.registeredEmitter = null
    }
  }
}