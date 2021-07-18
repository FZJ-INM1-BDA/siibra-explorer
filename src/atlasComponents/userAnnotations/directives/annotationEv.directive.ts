import { Directive, EventEmitter, Input, OnDestroy, Output } from "@angular/core";
import { Subscription } from "rxjs";
import { ModularUserAnnotationToolService } from "../tools/service";
import { TCallback } from "../tools/type";

type TAnnotationEv<T extends keyof TCallback> = {
  type: T
  callArg?: TCallback[T]['callArg']
}

@Directive({
  selector: '[annotation-event-directive]',
  exportAs: 'annotationEventDir'
})
export class AnnotationEventDirective implements OnDestroy{

  @Input('annotation-event-directive-filter')
  filter: (keyof TCallback)[] = null

  @Output('annotation-event-directive')
  ev = new EventEmitter<TAnnotationEv<keyof TCallback>>()

  private subs: Subscription[] = []

  constructor(svc: ModularUserAnnotationToolService){
    this.subs.push(
      svc.toolEvents.subscribe(<T extends keyof TCallback>(event: { type: T } & TCallback[T]['callArg']) => {
        if (this.filter?.includes) {
          if (this.filter.includes(event.type)) {
            this.ev.emit(event)
          }
        } else {
          this.ev.emit(event)
        }
      })
    )
  }

  ngOnDestroy(){
    while(this.subs.length > 0)this.subs.pop().unsubscribe()
  }
}
