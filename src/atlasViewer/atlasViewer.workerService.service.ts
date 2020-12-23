import { Injectable } from "@angular/core";
import { fromEvent } from "rxjs";
import { filter, take } from "rxjs/operators";
import { getUuid } from "src/util/fn.js";

/* telling webpack to pack the worker file */
import '../util/worker.js'

/**
 * export the worker, so that services that does not require dependency injection can import the worker
 */
export const worker = new Worker('worker.js')

interface IWorkerMessage {
  method: string
  param: any
}

@Injectable({
  providedIn: 'root',
})

export class AtlasWorkerService {
  public worker = worker

  async sendMessage(data: IWorkerMessage){

    const newUuid = getUuid()
    this.worker.postMessage({
      id: newUuid,
      ...data
    })
    const message = await fromEvent(this.worker, 'message').pipe(
      filter((message: MessageEvent) => message.data.id && message.data.id === newUuid),
      take(1)
    ).toPromise()
    
    const { data: returnData } = message as MessageEvent
    const { id, ...rest } = returnData
    return rest
  }
}
