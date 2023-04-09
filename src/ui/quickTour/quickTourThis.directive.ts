import { Directive, ElementRef, Input, OnChanges, OnDestroy, OnInit, TemplateRef } from "@angular/core";
import { QuickTourService } from "src/ui/quickTour/quickTour.service";
import { EnumQuickTourSeverity, IQuickTourOverwritePosition, TQuickTourPosition, QuickTourSeverity } from "src/ui/quickTour/constrants";

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
  @Input('quick-tour-severity') quickTourSeverity: EnumQuickTourSeverity | keyof typeof QuickTourSeverity = EnumQuickTourSeverity.MEDIUM

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
