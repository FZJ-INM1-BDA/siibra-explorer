import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  OnInit,
  Output, ViewChild
} from "@angular/core";
import {Subscription} from "rxjs";
import {QuickTourService} from "src/ui/quickTour/quickTour.service";
import {map} from "rxjs/operators";
import {QuickTourPosition} from "src/ui/quickTour/constrants";

@Component({
  selector : 'quick-tour',
  templateUrl : './quickTour.temlate.html',
  styleUrls : ['./quickTour.style.css',],
})
export class QuickTourComponent implements OnInit, AfterViewInit {

  public slideWidth = 300
  private tip: any

  public isLast = false
  public left: number
  public top: number
  private topHardcoded = false
  private leftHardcoded = false
  public description: string
  public order: number

  private targetElWidth: number
  private targetElHeight: number

  public position: QuickTourPosition

  public tipHidden = true
  public flexClass: string
  public positionChangedByArrow = false

  private subscriptions: Subscription[] = []

  @Output() destroy = new EventEmitter()

  @ViewChild('tipCard') tipCardEl: ElementRef
  @ViewChild('arrowEl') arrowEl: ElementRef

  constructor(public quickTourService: QuickTourService) {}

  ngOnInit() {
    this.subscriptions.push(
      this.quickTourService.currentTip$.pipe(

        map(tip => {
          if (!tip) return
          this.clear()
          this.tip = tip
          this.description = tip.description
          this.position = tip.position
          this.order = tip.order
          this.isLast = tip === [...this.quickTourService.quickTourThisDirectives].pop()
          this.setFlexClass()

          this.calculate()
          if (tip.position.left) {
            this.leftHardcoded = true
            this.left = tip.position.left
          }
          if (tip.position.top) {
            this.topHardcoded = true
            this.top = tip.position.top
          }

          setTimeout(() => this.calculateArrowPosition())


        }),
      ).subscribe()
    )
  }

  ngAfterViewInit() {
    this.calculate()
  }

  clear() {
    this.tip = null
    this.left = null
    this.topHardcoded = false
    this.leftHardcoded = false
    this.top = null
    this.description = null
    this.position = null
    this.order = null
    this.targetElWidth = null
    this.targetElHeight = null
    this.positionChangedByArrow = false
    this.tipHidden = true
    this.flexClass = null
  }

  calculate() {
    const tip = this.tip
    if (tip === null) return

    const { x, y, width, height } = tip.getHostPos()

    this.targetElWidth = width
    this.targetElHeight = height

    if (this.tipCardEl) setTimeout(() => {
      if (!this.leftHardcoded) {
        this.left = x
        this.calculatePosition('left', tip, width, height)
      }
      if (!this.topHardcoded) {
        this.top = y
        this.calculatePosition('top', tip, width, height)
      }
    })
  }

  calculatePosition(calculate: 'top' | 'left', tip, elementWidth, elementHeight) {
    const cardWidth = this.tipCardEl.nativeElement.offsetWidth
    const cardHeight = this.tipCardEl.nativeElement.offsetHeight
    const calculateTop = calculate === 'top'
    const calculateLeft = calculate === 'left'

    if (tip.position?.position) {
      if (tip.position.position.includes('top') && calculateTop) {
        this.top -= cardHeight
      }
      if (tip.position.position.includes('right') && calculateLeft) {
        this.left += elementWidth
      }
      if (tip.position.position.includes('bottom') && calculateTop) {
        this.top += elementHeight
      }
      if (tip.position.position.includes('left') && calculateLeft) {
        this.left -= cardWidth
      }
    }
    if (tip.position.align) {
      if (tip.position.align === 'right' && calculateLeft) {
        this.left -= cardWidth - elementWidth
      }
      if (tip.position.align === 'bottom' && calculateTop) {
        this.top -= cardHeight - elementHeight
      }
      if (tip.position.align === 'center') {
        if (['right', 'left'].includes(tip.position.position) && calculateTop) {
          this.top -= (cardHeight - elementHeight)/2
        }
        if (['bottom', 'top'].includes(tip.position.position) && calculateLeft) {
          this.left -= (cardWidth - elementWidth)/2
        }
      }
    }
  }

  calculateArrowPosition() {
    if (['top-left', 'top-right'].includes(this.position.arrowPosition)) {
      if (!this.position.arrowMargin || !this.position.arrowMargin.top) {
        this.position.arrowMargin = {}
        this.position.arrowMargin.top = 0
      }
      this.position.arrowMargin.top += -this.tipCardEl.nativeElement.offsetHeight

      if (!this.positionChangedByArrow) this.top += this.tipCardEl.nativeElement.offsetHeight
      this.positionChangedByArrow = true
    }

    if (['bottom-left', 'bottom-right'].includes(this.position.arrowPosition)) {
      if (!this.position.arrowMargin || !this.position.arrowMargin.top) {
        this.position.arrowMargin = {}
        this.position.arrowMargin.top = 0
      }
      this.position.arrowMargin.top += this.tipCardEl.nativeElement.offsetHeight
    }

    if (['bottom-left', 'bottom-right', 'bottom'].includes(this.position.arrowPosition)) {
      if (!this.positionChangedByArrow) this.top -= this.arrowEl.nativeElement.offsetHeight
      this.positionChangedByArrow = true
    }

    this.tipHidden = false
  }

  setFlexClass() {
    const position = this.tip.position
    this.flexClass = position?.arrowPosition.includes('right')?
        position?.arrowAlign === 'top'? 'flex-row-reverse align-items-start' :
            position?.arrowAlign === 'center'? 'flex-row-reverse align-items-center' :
                position?.arrowAlign === 'bottom'? 'flex-row-reverse align-items-end' :
                    position?.arrowPosition.includes('top')? 'align-items-start' : 'flex-row-reverse align-items-end'
      :position?.arrowPosition.includes('left')?
        position?.arrowAlign === 'top'? 'flex-row align-items-start' :
            position?.arrowAlign === 'center'? 'flex-row align-items-center' :
                position?.arrowAlign === 'bottom'? 'flex-row align-items-end' :
                    position?.arrowPosition.includes('top')? 'align-items-start' : 'align-items-end'
        :position?.arrowPosition.includes('top')?
            position?.arrowAlign === 'left'? 'flex-column align-items-start' :
                position?.arrowAlign === 'center'? 'flex-column align-items-center' :
                    position?.arrowAlign === 'right'? 'flex-column align-items-end' :
                        position?.arrowPosition.includes('left')? 'align-items-start' : 'align-items-end'
          :position?.arrowPosition.includes('bottom')?
                position?.arrowAlign === 'left'? 'flex-column-reverse align-items-end' :
                    position?.arrowAlign === 'center'? 'flex-column-reverse align-items-center' :
                        position?.arrowAlign === 'right'? 'flex-column-reverse align-items-end' :
                            position?.arrowPosition.includes('left')? 'align-items-start' : 'align-items-end' : ''
  }
}
