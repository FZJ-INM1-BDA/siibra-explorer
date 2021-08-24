// tslint:disable:no-console

import { Injectable } from "@angular/core";
import { environment } from 'src/environments/environment'

@Injectable({
  providedIn: 'root',
})

export class LoggingService {

  get loggingFlag(){
    return window['__IAV_LOGGING_FLAG__'] || !environment.PRODUCTION
  }

  public log(...arg) {
    if (this.loggingFlag) { console.log(...arg) }
  }
  public warn(...arg) {
    if (this.loggingFlag) { console.warn(...arg) }
  }
  public error(...arg) {
    if (this.loggingFlag) { console.error(...arg) }
  }
}
