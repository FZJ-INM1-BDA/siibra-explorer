import { Injectable } from "@angular/core";

/**
 * export the worker, so that services that does not require dependency injection can import the worker
 */
export const worker = new Worker('worker.js')

@Injectable({
  providedIn:'root'
})

export class AtlasWorkerService{
  public worker = worker
  public safeMeshSet : Map<string, Set<number>> = new Map()
}

/* telling webpack to pack the worker file */
require('../util/worker.js')