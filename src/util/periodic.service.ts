import { Injectable } from "@angular/core";
import { wait } from "./fn";

@Injectable({
  providedIn: 'root'
})
export class PeriodicSvc{
  
  async addToQueue(callback: () => boolean) {
    return await PeriodicSvc.AddToQueue(callback)
  }

  /**
   * @description retry a callback until it succeeds
   * @param callback 
   */
  static async AddToQueue(callback: () => boolean) {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (callback()) {
        break
      }
      await wait(160)
    }
  }
}
