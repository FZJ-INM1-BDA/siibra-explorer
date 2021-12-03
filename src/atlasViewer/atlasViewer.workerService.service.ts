import { Injectable } from "@angular/core";
import { fromEvent } from "rxjs";
import { filter, take } from "rxjs/operators";
import { getUuid } from "src/util/fn";

// worker is now exported in angular.json file
export const worker = new Worker('worker.js')

interface IWorkerMessage {
  method: string
  param: any
  transfers?: any[]
}

@Injectable({
  providedIn: 'root',
})

export class AtlasWorkerService {
  public worker = worker

  async sendMessage(_data: IWorkerMessage){

    const { transfers = [], ...data } = _data
    const newUuid = getUuid()
    this.worker.postMessage({
      id: newUuid,
      ...data
    }, transfers)
    const message = await fromEvent(this.worker, 'message').pipe(
      filter((message: MessageEvent) => message.data.id && message.data.id === newUuid),
      take(1)
    ).toPromise()
    
    const { data: returnData } = message as MessageEvent
    const { id, error, ...rest } = returnData
    if (error) {
      throw new Error(error.message || error)
    }
    return rest
  }
}
