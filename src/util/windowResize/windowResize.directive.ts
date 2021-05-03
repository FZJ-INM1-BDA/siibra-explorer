import { Directive, EventEmitter, Input, OnChanges, OnInit, Output } from "@angular/core";
import { Subscription } from "rxjs";
import { ResizeObserverService } from "./windowResize.service";

@Directive({
  selector: '[iav-window-resize]',
  exportAs: 'iavWindowResize'
})

export class ResizeObserverDirective implements OnChanges, OnInit {
  @Input('iav-window-resize-type')
  type: 'debounce' | 'throttle' = 'throttle'

  @Input('iav-window-resize-time')
  time: number = 160

  @Input('iav-window-resize-throttle-leading')
  throttleLeading = false

  @Input('iav-window-resize-throttle-trailing')
  throttleTrailing = true

  @Output('iav-window-resize-event')
  ev: EventEmitter<Event> = new EventEmitter()

  private sub: Subscription[] = []

  constructor(private svc: ResizeObserverService){}

  ngOnInit(){
    this.configure()
  }
  ngOnChanges(){
    this.configure()
  }

  configure(){
    while(this.sub.length > 0) this.sub.pop().unsubscribe()

    let sub: Subscription
    if (this.type === 'throttle') {
      sub = this.svc.getThrottledResize(
        this.time, 
        {
          leading: this.throttleLeading,
          trailing: this.throttleTrailing
        }
      ).subscribe(event => this.ev.emit(event))
    }

    if (this.type === 'debounce') {
      sub = this.svc.getDebouncedResize(
        this.time,
      ).subscribe(event => this.ev.emit(event))
    }

    if (!this.type) {
      sub = this.svc.windowResize.pipe(
      ).subscribe(event => this.ev.emit(event))
    }

    this.sub.push(sub)
  }
}
