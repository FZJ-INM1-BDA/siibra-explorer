import {Directive, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from "@angular/core";
import {QuickTourService} from "src/ui/quickTour/quickTour.service";
import {QuickTourPosition} from "src/ui/quickTour/constrants";

@Directive({
  selector: '[quick-tour]'
})
export class QuickTourThis implements OnInit, OnChanges, OnDestroy {

    @Input('quick-tour-order') order: number = 0
    @Input('quick-tour-description') description: string = 'No description'
    @Input('quick-tour-position') position: QuickTourPosition

    constructor(private quickTourService: QuickTourService,
                private el: ElementRef) {}

    public getHostPos() {
      const { x, y, width, height } = (this.el.nativeElement as HTMLElement).getBoundingClientRect()
      return {x, y, width, height}
    }

    ngOnInit() {
      this.quickTourService.register(this)
    }

    ngOnChanges(changes: SimpleChanges) {
      this.quickTourService.changeDetected(this.order)
    }

    ngOnDestroy() {
      this.quickTourService.unregister(this)
    }
}
