import { Directive, Input, Output } from "@angular/core";
import { map } from "rxjs/operators";
import { LblEventSvc } from "src/util/constants";

@Directive({
  selector: '[sxplr-label-event]',
  exportAs: 'sxplrLabelEvent',
  standalone: true,
})

export class LabelEventDirective {
  @Input()
  labels: string[] = []

  @Output()
  triggered = this.svc.labels$.pipe(
    map(labels => labels.some(label => this.labels.includes(label))),
  )

  constructor(private svc: LblEventSvc){
  }
}
