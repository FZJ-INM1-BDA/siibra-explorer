import {Directive, ElementRef, Input, OnDestroy, OnInit} from "@angular/core";
import {Observable} from "rxjs";
import {QuickTourService} from "src/ui/quickTour/quickTour.service";

@Directive({
  selector: '[quick-tour]'
})
export class QuickTourThis implements OnInit, OnDestroy {

    @Input('quick-tour-overwrite-pos') overwritePos$: Observable<{
        left?: number
        top?: number
        arrowPosition?: 'top' | 'top-right' | 'right' | 'bottom-right' | 'bottom' | 'bottom-left' | 'left' | 'top-left'
        arrowAlign?: 'right' | 'left' | 'top' | 'bottom' | 'center'
        arrowMargin?: any
        arrowTransform?: string
        arrow?: string
        recalculate?: boolean
    }>

    @Input('quick-tour-order') order: number = 0
    @Input('quick-tour-description') description: string = 'No description'
    @Input('quick-tour-position') position: 'top' | 'top-right' | 'right' | 'bottom-right' | 'bottom' | 'bottom-left' | 'left' | 'top-left'
    @Input('quick-tour-align') align: 'right' | 'left' | 'top' | 'bottom' | 'center'

    constructor(private quickTourService: QuickTourService,
                private el: ElementRef) {}

    public calcPos() {
      const { x, y, width, height } = (this.el.nativeElement as HTMLElement).getBoundingClientRect()
      return {x, y, width, height}
    }

    ngOnInit() {
      this.quickTourService.register(this)
    }

    ngOnDestroy() {
      this.quickTourService.unregister(this)
    }
}
