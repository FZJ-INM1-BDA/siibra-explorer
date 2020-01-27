import { Directive, ElementRef, EventEmitter, OnDestroy, OnInit, Output } from "@angular/core";
import { fromEvent, Subscription } from "rxjs";
import { switchMapTo, takeUntil } from "rxjs/operators";

@Directive({
  selector: '[iav-captureClickListenerDirective]',
})

export class CaptureClickListenerDirective implements OnInit, OnDestroy {

  private subscriptions: Subscription[] = []
  @Output('iav-captureClickListenerDirective-onClick') public mapClicked: EventEmitter<any> = new EventEmitter()
  @Output('iav-captureClickListenerDirective-onMousedown') public mouseDownEmitter: EventEmitter<any> = new EventEmitter()

  constructor(private el: ElementRef) { }

  public ngOnInit() {
    const mouseDownObs$ = fromEvent(this.el.nativeElement, 'mousedown', { capture: true })
    const mouseMoveObs$ = fromEvent(this.el.nativeElement, 'mousemove', { capture: true })
    const mouseUpObs$ = fromEvent(this.el.nativeElement, 'mouseup', { capture: true })

    this.subscriptions.push(
      mouseDownObs$.subscribe(event => {
        this.mouseDownEmitter.emit(event)
      }),
      mouseDownObs$.pipe(
        switchMapTo(
          mouseUpObs$.pipe(
            takeUntil(mouseMoveObs$),
          ),
        ),
      ).subscribe(event => {
        this.mapClicked.emit(event)
      }),
    )
  }

  public ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe())
  }

}