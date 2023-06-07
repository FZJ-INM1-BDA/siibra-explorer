import { Injectable } from "@angular/core";
import { fromEvent } from "rxjs";
import { filter, take } from "rxjs/operators";
import { getUuid } from "src/util/fn";

interface IWorkerMessage {
  method: string
  param: any
  transfers?: any[]
}

@Injectable({
  providedIn: 'root',
})

export class AtlasWorkerService {
  private worker: Worker

  constructor(){
    this.worker = new Worker('worker.js')
  }

  async sendMessage(_data: IWorkerMessage){

    const { transfers = [], ...data } = _data
    const newUuid = getUuid()
    this.worker.postMessage({
      id: newUuid,
      ...data
    }, transfers)
    const message = await fromEvent(this.worker, 'message').pipe(
      filter((msg: MessageEvent) => msg.data.id && msg.data.id === newUuid),
      take(1)
    ).toPromise()

    const { data: returnData } = message as MessageEvent
    const { error, ...rest } = returnData
    if (error) {
      throw new Error(error.message || error)
    }
    return rest
  }
}
