import {Directive, ElementRef, Input, OnDestroy, OnInit} from "@angular/core";
import {Observable, Observer, Subscription} from "rxjs";
import {switchMapTo, takeUntil} from "rxjs/operators";
import {RegionToolsMenuComponent} from "src/ui/regionToolsMenu/regionToolsMenu.component";

@Directive({
    selector: '[singleClickOnNehubaWithoutNavigate]'
})

export class SingleClickOnNehubaWithoutNavigateDirective implements OnInit, OnDestroy {

    private subscriptions: Subscription[] = []
    @Input() regionToolsMenu: RegionToolsMenuComponent


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
                this.regionToolsMenu.mouseDownNehuba(e.event)
            }),
            mouseDownObs$.pipe(
                switchMapTo(
                    mouseUpObs$.pipe(
                        takeUntil(mouseMoveObs$)
                    )
                )
            ).subscribe(e => {
                this.regionToolsMenu.mouseUpNehuba(e.event)
            })
        )


        // Listen Touch Evenets
        const touchStartObs$ = new Observable((observer: Observer<any>) => {
            this.el.nativeElement.addEventListener('touchstart', event => observer.next({eventName: 'mousedown', event}), true)
        })  as Observable<{eventName: string, event: MouseEvent}>
        const touchMoveObs$ = new Observable((observer: Observer<any>) => {
            this.el.nativeElement.addEventListener('touchmove', event => observer.next({eventName: 'mousemove', event}), true)
        })  as Observable<{eventName: string, event: MouseEvent}>
        const touchEndObs$ = new Observable((observer: Observer<any>) => {
            this.el.nativeElement.addEventListener('touchend', event => observer.next({eventName: 'mouseup', event}), true)
        })  as Observable<{eventName: string, event: MouseEvent}>

        this.subscriptions.push(
            touchStartObs$.subscribe(e => {
                this.regionToolsMenu.mouseDownNehuba(e.event)
            }),
            touchStartObs$.pipe(
                switchMapTo(
                    touchEndObs$.pipe(
                        takeUntil(touchMoveObs$)
                    )
                )
            ).subscribe(e => {
                this.regionToolsMenu.mouseUpNehuba(e.event)
            })
        )
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(s=> s.unsubscribe())
    }

}