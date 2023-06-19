import { Injectable } from "@angular/core";
import { wait } from "./fn";

@Injectable({
  providedIn: 'root'
})
export class PeriodicSvc{
  /**
   * @description retry a callback until it succeeds
   * @param callback 
   */
  async addToQueue(callback: () => boolean) {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (callback()) {
        break
      }
      await wait(160)
    }
  }
}
