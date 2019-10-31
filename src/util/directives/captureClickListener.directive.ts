import {Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output} from "@angular/core";
import {Observable, Observer, Subscription} from "rxjs";
import {switchMapTo, takeUntil} from "rxjs/operators";
import {RegionMenuComponent} from "src/ui/regionToolsMenu/regionMenu.component";

@Directive({
    selector: '[iav-captureClickListenerDirective]'
})

export class CaptureClickListenerDirective implements OnInit, OnDestroy {

    private subscriptions: Subscription[] = []
    @Output() mapClicked: EventEmitter<any> = new EventEmitter()
    @Output() mouseDownEmitter: EventEmitter<any> = new EventEmitter()


    constructor(private el: ElementRef){}

    ngOnInit(): void {

        // Listen click Events
        const mouseDownObs$ = new Observable((observer: Observer<any>) => {
            this.el.nativeElement.addEventListener('mousedown', event => observer.next({eventName: 'mousedown', event}), true)
        })  as Observable<{eventName: string, event: MouseEvent}>
        const mouseMoveObs$ = new Observable((observer: Observer<any>) => {
            this.el.nativeElement.addEventListener('mousemove', event => observer.next({eventName: 'mousemove', event}), true)
        })  as Observable<{eventName: string, event: MouseEvent}>
        const mouseUpObs$ = new Observable((observer: Observer<any>) => {
            this.el.nativeElement.addEventListener('mouseup', event => observer.next({eventName: 'mouseup', event}), true)
        })  as Observable<{eventName: string, event: MouseEvent}>

        this.subscriptions.push(
            mouseDownObs$.subscribe(e => {
                this.mouseDownEmitter.emit(e.event)
            }),
            mouseDownObs$.pipe(
                switchMapTo(
                    mouseUpObs$.pipe(
                        takeUntil(mouseMoveObs$)
                    )
                )
            ).subscribe(e => {
                this.mapClicked.emit(e.event)
            })
        )
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(s=> s.unsubscribe())
    }

}