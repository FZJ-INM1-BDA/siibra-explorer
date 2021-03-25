import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  OnDestroy,
  OnInit,
  Output, ViewChild
} from "@angular/core";
import {Observable, of, Subscription} from "rxjs";
import {QuickTourService} from "src/ui/quickTour/quickTour.service";
import {map, switchMap} from "rxjs/operators";

@Component({
  selector : 'quick-tour',
  templateUrl : './quickTour.temlate.html',
  styleUrls : ['./quickTour.style.css',],
})
export class QuickTourComponent implements OnInit, AfterViewInit {

  slideWidth = 300

  private tip

  public left
  public top
  public leftBeforeHardcodeChange
  public topBeforeHardcodeChange
  public description
  public order

  private targetElWidth
  private targetElHeight
  private currentTip

  public overwritePos$: Observable<any>
  public overwritePos: any

  public tipHidden = true

  private subscriptions: Subscription[] = []

  @Output() destroy = new EventEmitter()

  @ViewChild('tipCard') tipCardEl: ElementRef
  @ViewChild('arrowEl') arrowEl: ElementRef

  constructor(public quickTourService: QuickTourService) {}

  ngOnInit() {
    this.subscriptions.push(
      this.quickTourService.currentTip$.pipe(

        switchMap(tip => {
          if (!tip) return
          this.tip = null
          this.tip = tip

          this.clear()
          this.calculate()

          return tip.overwritePos$ || of(null)

        }),
        map((op: any) => {
          if (op) {
            this.tipHidden = true

            setTimeout(() => {
              if (op.recalculate) {
                this.clear()
                this.calculate()
              }
              this.overwritePos = null
              this.overwritePos = op

              if (op.left) {
                this.leftBeforeHardcodeChange = this.left
                this.left = op.left
              } else if (this.leftBeforeHardcodeChange) {
                this.left = this.leftBeforeHardcodeChange
              }
              if (op.top) {
                this.topBeforeHardcodeChange = this.top
                this.top = op.top
              } else if (this.topBeforeHardcodeChange) {
                this.top = this.topBeforeHardcodeChange
              }
              setTimeout(() => this.calculateArrowPosition())
            })
          }
        })
      ).subscribe(),

    )
  }


  ngAfterViewInit() {
    this.calculatePosition(this.currentTip, this.targetElWidth, this.targetElHeight)
  }

  clear() {
    this.left = null
    this.top = null
    this.leftBeforeHardcodeChange = null
    this.topBeforeHardcodeChange = null
    this.description = null
    this.overwritePos$ = null
    this.overwritePos = null
    this.order = null
    this.targetElWidth = null
    this.targetElHeight = null
    this.positionChangedByArrow = false
  }

  calculate() {
    const tip = this.tip
    if (tip === null) return

    const { x, y, width, height } = tip.calcPos()
    this.left = x
    this.top = y
    this.description = tip.description
    this.overwritePos$ = tip.overwritePos$
    this.order = tip.order

    this.targetElWidth = width
    this.targetElHeight = height
    this.currentTip = tip

    if (this.tipCardEl) setTimeout(() =>this.calculatePosition(tip, width, height))
  }

  calculatePosition(tip, elementWidth, elementHeight) {
    const cardWidth = this.tipCardEl.nativeElement.offsetWidth
    const cardHeight = this.tipCardEl.nativeElement.offsetHeight

    if (tip.position) {
      if (tip.position.includes('top')) {
        this.top -= cardHeight
      }
      if (tip.position.includes('right')) {
        this.left += elementWidth
      }
      if (tip.position.includes('bottom')) {
        this.top += elementHeight
      }
      if (tip.position.includes('left')) {
        this.left -= cardWidth
      }
    }
    if (tip.align) {
      if (tip.align === 'right') {
        this.left -= cardWidth - elementWidth
      }
      if (tip.align === 'bottom') {
        this.top -= cardHeight - elementHeight
      }
      if (tip.align === 'center') {
        if (['right', 'left'].includes(tip.position)) {
          this.top -= (cardHeight - elementHeight)/2
        }
        if (['bottom', 'top'].includes(tip.position)) {
          this.left -= (cardWidth - elementWidth)/2
        }
      }
    }
  }

  calculateArrowPosition() {
    if (['top-left', 'top-right'].includes(this.overwritePos.arrowPosition)) {
      if (!this.overwritePos.arrowMargin || !this.overwritePos.arrowMargin.top) {
        this.overwritePos.arrowMargin = {}
        this.overwritePos.arrowMargin.top = 0
      }
      this.overwritePos.arrowMargin.top += -this.arrowEl.nativeElement.offsetHeight

      if (!this.positionChangedByArrow) this.top += this.arrowEl.nativeElement.offsetHeight
      this.positionChangedByArrow = true
    }

    if (['bottom-left', 'bottom-right'].includes(this.overwritePos.arrowPosition)) {
      if (!this.overwritePos.arrowMargin || !this.overwritePos.arrowMargin.top) {
        this.overwritePos.arrowMargin = {}
        this.overwritePos.arrowMargin.top = 0
      }
      this.overwritePos.arrowMargin.top += this.tipCardEl.nativeElement.offsetHeight
    }

    if (['bottom-left', 'bottom-right', 'bottom'].includes(this.overwritePos.arrowPosition)) {
      if (!this.positionChangedByArrow) this.top -= this.arrowEl.nativeElement.offsetHeight
      this.positionChangedByArrow = true
    }

    this.tipHidden = false
  }

  positionChangedByArrow = false

  get isLast() {
    return this.quickTourService.currentTip$.value === [...this.quickTourService.quickTourThisDirectives].pop()
  }

}
