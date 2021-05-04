import {
  Component,
  ElementRef,
  HostListener,
  SecurityContext,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import { combineLatest, Subscription } from "rxjs";
import { QuickTourService } from "../quickTour.service";
import { debounceTime, map, shareReplay, tap } from "rxjs/operators";
import { DomSanitizer } from "@angular/platform-browser";
import { QuickTourThis } from "../quickTourThis.directive";
import { clamp } from "src/util/generator";

@Component({
  templateUrl : './quickTour.template.html',
  styleUrls : [
    './quickTour.style.css'
  ],
})
export class QuickTourComponent {

  static TourCardMargin = 24
  static TourCardWidthPx = 256
  static TourCardHeightPx = 64
  static TourCardWindowMargin = 8

  @ViewChild('quickTourDialog', { read: ElementRef })
  private quickTourDialog: ElementRef

  public tourCardWidth = `${QuickTourComponent.TourCardWidthPx}px`
  public arrowTmpl: TemplateRef<any>
  public arrowSrc: string

  @HostListener('window:keydown', ['$event'])
  keydownListener(ev: KeyboardEvent){
    if (ev.key === 'Escape') {
      this.quickTourService.endTour()
    }
  }

  public tourCardTransform = `translate(-500px, -500px)`
  public customArrowTransform = `translate(-500px, -500px)`

  public arrowFrom: [number, number] = [0, 0]
  public arrowTo: [number, number] = [0, 0]
  public arrowType: 'straight' | 'concave-from-top' | 'concave-from-bottom' = 'straight'

  private subscriptions: Subscription[] = []
  private currTipLinkedObj$ = this.quickTourService.currentTip$.pipe(
    shareReplay(1)
  )

  public isLast$ = this.currTipLinkedObj$.pipe(
    map(val => !val.next)
  )

  public isFirst$ = this.currTipLinkedObj$.pipe(
    map(val => !val.prev)
  )

  public description$ = this.currTipLinkedObj$.pipe(
    map(val => val.thisObj.description)
  )

  private quickTourSize$ = this.currTipLinkedObj$.pipe(
    map(val => val.list.size())
  )

  private quickTourIdx$ = this.currTipLinkedObj$.pipe(
    map(val => val.index)
  )

  public quickTourProgress$ = combineLatest([
    this.quickTourSize$,
    this.quickTourIdx$
  ]).pipe(
    map(([ size, idx ]) => {
      return Array(size).fill(false).map((_, index) => index === idx ? 'active' : _)
    })
  )

  public overwrittenPosition = this.currTipLinkedObj$.pipe(
    map(val => val.thisObj.overwritePosition)
  )

  private currTip: QuickTourThis

  constructor(
    public quickTourService: QuickTourService,
    private sanitizer: DomSanitizer,
  ) {

    this.subscriptions.push(
      
      this.quickTourService.detectChanges$.pipe(
        /**
         * the debounce does two things:
         * - debounce expensive calculate transform call
         * - allow change detection to finish rendering element
         */
        debounceTime(16)
      ).subscribe(() => {
        this.calculateTransforms()
      }),

      this.quickTourService.currentTip$.pipe(
        /**
         * subscriber is quite expensive.
         * only calculate at most once every 16 ms
         */
        debounceTime(16)
      ).subscribe(linkedObj => {
        this.arrowTmpl = null
        this.arrowSrc = null
        this.currTip = null

        if (!linkedObj) {
          // exit quick tour?
          return
        }
        this.currTip = linkedObj.thisObj
        this.calculateTransforms()
      })
    )
  }

  nextSlide(){
    this.quickTourService.nextSlide()
  }

  prevSlide(){
    this.quickTourService.previousSlide()
  }

  endTour(){
    this.quickTourService.endTour()
  }

  calculateTransforms() {
    if (!this.currTip) {
      return
    }
    const tip = this.currTip

    if (tip.overWriteArrow) {
      if (typeof tip.overWriteArrow === 'string') {
        this.arrowSrc = tip.overWriteArrow
      } else {
        this.arrowTmpl = tip.overWriteArrow
      }
    }

    if (tip.overwritePosition) {
      const { dialog, arrow } = tip.overwritePosition
      const { top: dialogTop, left: dialogLeft } = dialog
      const {
        top: arrowTop,
        left: arrowLeft,
      } = arrow
      this.tourCardTransform = this.sanitizer.sanitize(
        SecurityContext.STYLE,
        `translate(${dialogLeft}, ${dialogTop})`
      )
      this.customArrowTransform = this.sanitizer.sanitize(
        SecurityContext.STYLE,
        `translate(${arrowLeft}, ${arrowTop})`
      )
      return
    }

    const { x: hostX, y: hostY, width: hostWidth, height: hostHeight } = tip.getHostPos()
    const { innerWidth, innerHeight } = window

    const { position: tipPosition } = this.currTip
    const translate: {x: number, y: number} = { x: hostX + hostWidth / 2, y: hostY + hostHeight / 2 }

    const hostCogX = hostX + hostWidth / 2
    const hostCogY = hostY + hostHeight / 2

    let calcedPos: string = ''

    /**
     * if position is unspecfied, try to figure out position
     */
    if (!tipPosition) {

      // if host centre of grav is to the right of the screen
      // position tour el to the left, otherwise, right
      calcedPos += hostCogX > (innerWidth / 2)
        ? 'left'
        : 'right'

      // if host centre of grav is to the bottom of the screen
      // position tour el to the top, otherwise, bottom
      calcedPos += hostCogY > (innerHeight / 2)
        ? 'top'
        : 'bottom'
    }

    /**
     * if the directive specified where helper should appear
     * set the offset directly
     */

    const usePosition = tipPosition || calcedPos

    /**
     * default behaviour: center
     * overwrite if align keywords appear
     */

    if (usePosition.includes('top')) {
      translate.y = hostY
    }
    if (usePosition.includes('bottom')) {
      translate.y = hostY + hostHeight
    }
    if (usePosition.includes('left')) {
      translate.x = hostCogX
    }
    if (usePosition.includes('right')) {
      translate.x = hostCogX
    }

    /**
     * set tour card transform
     * set a given margin, so 
     */
    const { width: cmpWidth, height: cmpHeight } = this.quickTourDialog
      ? (this.quickTourDialog.nativeElement as HTMLElement).getBoundingClientRect()
      : {} as any

    const tourCardMargin = QuickTourComponent.TourCardMargin
    const tourCardWidth = cmpWidth || QuickTourComponent.TourCardWidthPx
    const tourCardHeight = cmpHeight || QuickTourComponent.TourCardHeightPx
    const tourCardWindowMargin = QuickTourComponent.TourCardWindowMargin

    /**
     * catch if element is off screen
     * clamp it inside the viewport
     */
    const tourCardTranslate = [
      clamp(translate.x, 0, innerWidth),
      clamp(translate.y, 0, innerHeight),
    ]
    if (usePosition.includes('top')) {
      tourCardTranslate[1] += -1 * tourCardMargin - tourCardHeight
    }
    if (usePosition.includes('bottom')) {
      tourCardTranslate[1] += tourCardMargin
    }
    if (usePosition.includes('left')) {
      tourCardTranslate[0] += -1 * tourCardMargin - tourCardWidth
    }
    if (usePosition.includes('right')) {
      tourCardTranslate[0] += tourCardMargin
    }
    tourCardTranslate[0] = clamp(
      tourCardTranslate[0],
      tourCardWindowMargin,
      innerWidth - tourCardWidth - tourCardWindowMargin
    )

    tourCardTranslate[1] = clamp(
      tourCardTranslate[1],
      tourCardWindowMargin,
      innerHeight - tourCardHeight - tourCardWindowMargin
    )
    this.tourCardTransform = `translate(${tourCardTranslate[0]}px, ${tourCardTranslate[1]}px)`

    /**
     * set arrow from / to
     */
    
    const {
      arrowTo
    } = (() => {
      if (usePosition.includes('top')) {
        return {
          arrowTo: [ hostCogX, hostY ]
        }
      }
      if (usePosition.includes('bottom')) {
        return {
          arrowTo: [ hostCogX, hostY + hostHeight ]
        }
      }
      if (usePosition.includes('left')) {
        return {
          arrowTo: [ hostX, hostCogY ]
        }
      }
      if (usePosition.includes('right')) {
        return {
          arrowTo: [ hostX + hostWidth, hostCogY ]
        }
      }
    })()


    const arrowFrom = [ arrowTo[0], arrowTo[1] ]

    if (usePosition.includes('top')) {
      arrowFrom[1] -= tourCardMargin + (tourCardHeight / 2)
      this.arrowType = 'concave-from-bottom'
    }
    if (usePosition.includes('bottom')) {
      arrowFrom[1] += tourCardMargin + (tourCardHeight / 2)
      this.arrowType = 'concave-from-top'
    }
    if (usePosition.includes('left')) {
      arrowFrom[0] -= tourCardMargin
      this.arrowType = 'straight'
    }
    if (usePosition.includes('right')) {
      arrowFrom[0] += tourCardMargin
      this.arrowType = 'straight'
    }
    this.arrowFrom = arrowFrom as [number, number]
    this.arrowTo = arrowTo as [number, number]

    /**
     * set arrow type
     */
    
    this.arrowType = 'straight'

    if (usePosition.includes('top')) {
      this.arrowType = 'concave-from-bottom'
    }
    if (usePosition.includes('bottom')) {
      this.arrowType = 'concave-from-top'
    }
  }

  handleWindowResize(){
    this.calculateTransforms()
  }
}