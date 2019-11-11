import {Directive, ElementRef, EventEmitter, OnDestroy, OnInit, Output} from "@angular/core";
import {Subscription} from "rxjs";

@Directive({
    selector: '[iav-captureClickListenerDirective]'
})

export class CaptureClickListenerDirective implements OnInit, OnDestroy {

    private subscriptions: Subscription[] = []
    @Output() mapClicked: EventEmitter<any> = new EventEmitter()
    @Output() mouseDownEmitter: EventEmitter<any> = new EventEmitter()
    mouseDown$
    mouseMove$
    mouseUp$
    mouseDown = false
    mouseDownMoved = false

    constructor(private el: ElementRef){

        this.mouseDown$ = (event) => {
            this.mouseDown = true
            this.mouseDownEmitter.emit(event)
        }
        this.mouseMove$ = (event) => {
            if (this.mouseDown)
                this.mouseDownMoved = true
        }
        this.mouseUp$ = (event) => {
            if (!this.mouseDownMoved)
                this.mapClicked.emit(event)
            this.mouseDownMoved = false
            this.mouseDown = false
        }
    }

    ngOnInit(): void {
        this.el.nativeElement.addEventListener('mousedown',  this.mouseDown$ , true)
        this.el.nativeElement.addEventListener('mousemove',  this.mouseMove$ , true)
        this.el.nativeElement.addEventListener('mouseup',  this.mouseUp$ , true)
    }

    ngOnDestroy(): void {
        this.el.nativeElement.removeEventListener('mousedown', this.mouseDown$, false)
        this.el.nativeElement.removeEventListener('mousemove', this.mouseMove$, false)
        this.el.nativeElement.removeEventListener('mouseup', this.mouseUp$, false)
        this.subscriptions.forEach(s=> s.unsubscribe())
    }

}