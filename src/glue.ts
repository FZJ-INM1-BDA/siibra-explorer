import { Injectable } from "@angular/core"
import { RegDeregController } from "./util/regDereg.base"


@Injectable({
  providedIn: 'root'
})

export class ClickInterceptorService extends RegDeregController<any, boolean>{

  callRegFns(ev: any){
    let intercepted = false
    for (const clickInc of this.callbacks) {
      
      const runNext = clickInc(ev)
      if (!runNext) {
        intercepted = true
        break
      }
    }

    if (!intercepted) this.fallback(ev)
  }

  fallback(_ev: any) {
    // called when the call has not been intercepted
  }
}
