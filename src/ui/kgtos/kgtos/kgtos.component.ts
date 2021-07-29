import { Component, Inject, Optional } from "@angular/core";
import { Observable } from "rxjs";
import { TOS_OBS_INJECTION_TOKEN } from "..";

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
