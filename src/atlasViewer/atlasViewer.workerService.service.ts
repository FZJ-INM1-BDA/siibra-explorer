import { Injectable } from "@angular/core";

@Injectable({
  providedIn:'root'
})

export class AtlasWorkerService{
  public worker = new Worker('worker.js')
  public safeMeshSet : Map<string, Set<number>> = new Map()
}