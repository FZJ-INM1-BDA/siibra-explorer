import {Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output} from "@angular/core";
import {fromEvent, Observable, Observer, Subscription} from "rxjs";
import {switchMapTo, takeUntil} from "rxjs/operators";

@Directive({
    selector: '[iav-captureClickListenerDirective]'
})

export class CaptureClickListenerDirective implements OnInit, OnDestroy {

    private subscriptions: Subscription[] = []
    @Output('iav-captureClickListenerDirective-onClick') mapClicked: EventEmitter<any> = new EventEmitter()
    @Output('iav-captureClickListenerDirective-onMousedown') mouseDownEmitter: EventEmitter<any> = new EventEmitter()


    constructor(private el: ElementRef){}

    ngOnInit(): void {
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
                        takeUntil(mouseMoveObs$)
                    )
                )
            ).subscribe(event => {
                this.mapClicked.emit(event)
            })
        )
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(s=> s.unsubscribe())
    }

}