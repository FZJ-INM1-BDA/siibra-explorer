import { Component, Inject, InjectionToken, Optional } from "@angular/core";
import { Observable } from "rxjs";

export const TOS_OBS_INJECTION_TOKEN = new InjectionToken<Observable<string>>('TOS_STRING')

@Component({
  selector: 'kgtos-component',
  templateUrl: './kgtos.template.html',
  styleUrls: [
    './kgtos.style.css',
  ],
})

export class KGToS {

  public kgTos$: Observable<string>

  constructor(
    @Optional() @Inject(TOS_OBS_INJECTION_TOKEN) kgTos$
  ) {
    this.kgTos$ = kgTos$
  }
}
