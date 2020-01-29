import { Injectable } from "@angular/core";

/* telling webpack to pack the worker file */
import '../util/worker.js'

/**
 * export the worker, so that services that does not require dependency injection can import the worker
 */
export const worker = new Worker('worker.js')

@Injectable({
  providedIn: 'root',
})

export class AtlasWorkerService {
  public worker = worker
}
