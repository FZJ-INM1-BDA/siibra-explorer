import { Directive, ElementRef, Input, OnChanges, OnDestroy, OnInit, TemplateRef } from "@angular/core";
import { QuickTourService } from "src/ui/quickTour/quickTour.service";
import { IQuickTourOverwritePosition, TQuickTourPosition } from "src/ui/quickTour/constrants";
import {LOCAL_STORAGE_CONST} from "src/util/constants";

@Directive({
  selector: '[quick-tour]',
  exportAs: 'quickTour'
})
export class QuickTourThis implements OnInit, OnChanges, OnDestroy {

  @Input('quick-tour-order') order: number = 0
  @Input('quick-tour-description') description: string = 'No description'
  @Input('quick-tour-description-md') descriptionMd: string
  @Input('quick-tour-position') position: TQuickTourPosition
  @Input('quick-tour-overwrite-position') overwritePosition: IQuickTourOverwritePosition
  @Input('quick-tour-overwrite-arrow') overWriteArrow: TemplateRef<any> | string
  @Input('quick-tour-check-auto-start') quickTourCheckAutoStart: boolean

  private attachedTmpl: ElementRef

  constructor(
    private quickTourService: QuickTourService,
    private el: ElementRef
  ) {}

  public getHostPos() {
    const { x, y, width, height } = (this.attachedTmpl?.nativeElement || this.el.nativeElement as HTMLElement).getBoundingClientRect()
    return { x, y, width, height }
  }

  ngOnInit() {
    this.quickTourService.register(this)

    if (this.quickTourCheckAutoStart) {
      if (!localStorage.getItem(LOCAL_STORAGE_CONST.QUICK_TOUR_VIEWED)) {
        this.quickTourService.startTour()
        localStorage.setItem(LOCAL_STORAGE_CONST.QUICK_TOUR_VIEWED, 'true')
      }
    }

  }

  ngOnChanges() {
    this.quickTourService.changeDetected(this)
  }

  ngOnDestroy() {
    this.quickTourService.unregister(this)
  }

  attachTo(tmp: ElementRef){
    this.attachedTmpl = tmp
    this.quickTourService.changeDetected(this)
  }
}
