// tslint:disable:no-console

import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root',
})

export class LoggingService {
  private loggingFlag: boolean = !PRODUCTION
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
