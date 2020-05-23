import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, Inject, TemplateRef, ViewChildren, QueryList } from "@angular/core";
import { combineLatest, concat, fromEvent, merge, Observable, of, Subject, BehaviorSubject } from "rxjs";
import { filter, map, scan, switchMap, takeUntil, startWith, pairwise, tap, shareReplay, distinctUntilChanged, switchMapTo, reduce } from "rxjs/operators";
import { clamp } from "src/util/generator";
import { DOCUMENT } from "@angular/common";

const TOUCHMOVE_THRESHOLD = 50
const SUBMENU_IXOBS_CONFIG = {

}

export interface ITunableProp{
  name: string
  displayName?: string
  values: string[]
  selected?: any
}

@Component({
  selector : 'mobile-overlay',
  templateUrl : './mobileOverlay.template.html',
  styleUrls : [
    './mobileOverlay.style.css',
  ],
  styles : [
    `
div.active > span:before
{
  content: '\u2022';
  width: 1em;
  display: inline-block;
  background:none;
}
div:not(.active) > span:before
{
  content : ' ';
  width : 1em;
  display: inline-block;
}
    `,
  ],
})

export class MobileOverlay implements OnInit, OnDestroy {

  @Input('iav-mobile-overlay-guide-tmpl')
  public guideTmpl: TemplateRef<any>

  @Input('iav-mobile-overlay-hide-ctrl-btn')
  public hideCtrlBtn: boolean = false

  @Input('iav-mobile-overlay-ctrl-btn-pos')
  public ctrlBtnPosition: { left: string, top: string } = { left: '50%', top: '50%' }
  
  @Input() public tunableProperties: ITunableProp[] = []
  
  @Output() public tunablePropertySelected: EventEmitter<ITunableProp> = new EventEmitter()
  @Output() public deltaValue: EventEmitter<{delta: number, selectedProp: ITunableProp}> = new EventEmitter()
  @Output() public valueSelected: EventEmitter<{ value: string, selectedProp: ITunableProp }> = new EventEmitter()

  @ViewChild('initiator', {read: ElementRef, static: true}) public initiator: ElementRef
  @ViewChild('mobileMenuContainer', {read: ElementRef, static: true}) public menuContainer: ElementRef
  @ViewChild('intersector', {read: ElementRef, static: true}) public intersector: ElementRef
  @ViewChild('subMenuObserver', {read: ElementRef, static: false}) public subMenuIx: ElementRef
  @ViewChild('setValueContainer', { read: ElementRef, static: false }) public setValueContainer?: ElementRef

  private _onDestroySubject: Subject<boolean> = new Subject()

  private _focusedProperties: ITunableProp
  get focusedProperty() {
    return this._focusedProperties
      ? this._focusedProperties
      : this.tunableProperties[0]
  }
  get focusedIndex() {
    return this._focusedProperties
      ? this.tunableProperties.findIndex(p => p === this._focusedProperties)
      : 0
  }

  private initiatorSingleTouchStart$: Observable<any>

  public showScreen$: Observable<boolean>
  public showProperties$: Observable<boolean>
  public showDelta$: Observable<boolean>
  public showInitiator$: Observable<boolean>
  private _drag$: Observable<any>
  private _thresholdDrag$: Observable<any>
  private intersectionObserver: IntersectionObserver
  private subMenuIxObs: IntersectionObserver

  constructor(
    @Inject(DOCUMENT) private document: Document
  ){

  }

  public ngOnDestroy() {
    this._onDestroySubject.next(true)
    this._onDestroySubject.complete()
    this.intersectionObserver && this.intersectionObserver.disconnect()
    this.subMenuIxObs && this.subMenuIxObs.disconnect()
  }

  public ngOnInit() {

    this.initiatorSingleTouchStart$ = fromEvent(this.initiator.nativeElement, 'touchstart').pipe(
      filter((ev: TouchEvent) => ev.touches.length === 1),
      shareReplay(1)
    )

    const itemCount = this.tunableProperties.length

    const config = {
      root: this.intersector.nativeElement,
      threshold: [...[...Array(itemCount)].map((_, k) => k / itemCount), 1],
    }

    this.intersectionObserver = new IntersectionObserver((arg) => {
      if (arg[0].isIntersecting) {
        const ratio = arg[0].intersectionRatio - (1 / this.tunableProperties.length / 2)
        this.focusItemIndex = this.tunableProperties.length - Math.round(ratio * this.tunableProperties.length) - 1
      }
    }, config)

    this.intersectionObserver.observe(this.menuContainer.nativeElement)

    this._drag$ = fromEvent(this.document, 'touchmove').pipe(
      filter((ev: TouchEvent) => ev.touches.length === 1),
      takeUntil(fromEvent(this.document, 'touchend').pipe(
        filter((ev: TouchEvent) => ev.touches.length === 0),
      )),
    )

    this._thresholdDrag$ = this._drag$.pipe(
      distinctUntilChanged((o, n) => {
        const deltaX = o.touches[0].screenX - n.touches[0].screenX
        const deltaY = o.touches[0].screenY - n.touches[0].screenY
        return (deltaX ** 2 + deltaY ** 2) < TOUCHMOVE_THRESHOLD
      }),
    )

    this.showProperties$ = this.initiatorSingleTouchStart$.pipe(
      switchMap(() => concat(
        this._thresholdDrag$.pipe(
          pairwise(),
          map(double => ({
            deltaX : double[1].touches[0].screenX - double[0].touches[0].screenX,
            deltaY : double[1].touches[0].screenY - double[0].touches[0].screenY,
          })),
          map(v => v.deltaY ** 2 > v.deltaX ** 2),
          scan((acc, _curr) => acc),
        ),
        of(false)
      )),
      startWith(false),
      distinctUntilChanged(),
      shareReplay(1)
    )

    this.showDelta$ = this.initiatorSingleTouchStart$.pipe(
      switchMap(() => concat(
        this._thresholdDrag$.pipe(
          pairwise(),
          map(double => ({
            deltaX : double[1].touches[0].screenX - double[0].touches[0].screenX,
            deltaY : double[1].touches[0].screenY - double[0].touches[0].screenY,
          })),
          scan((acc, _curr) => acc),
          map(v => v.deltaX ** 2 > v.deltaY ** 2),
        ),
        of(false),
      )),
      startWith(false),
      distinctUntilChanged(),
      shareReplay(1)
    )

    this.showInitiator$ = combineLatest(
      this.showProperties$,
      this.showDelta$,
    ).pipe(
      map(([flag1, flag2]) => !flag1 && !flag2),
    )

    this.showScreen$ = combineLatest(
      merge(
        fromEvent(this.initiator.nativeElement, 'touchstart'),
        fromEvent(this.initiator.nativeElement, 'touchend'),
      ),
      this.showInitiator$,
    ).pipe(
      map(([ev, showInitiator]: [TouchEvent, boolean]) => showInitiator && ev.touches.length === 1),
    )

    this.showDelta$.pipe(
      filter(flag => flag),
      switchMapTo(this._thresholdDrag$.pipe(
        pairwise(),
        map(double => double[1].touches[0].screenX - double[0].touches[0].screenX)
      )),
      takeUntil(this._onDestroySubject)
    ).subscribe(ev => {
      this.deltaValue.emit({
        delta: ev,
        selectedProp: this.focusedProperty
      })
    })

    const offsetObs$ = this.initiatorSingleTouchStart$.pipe(
      switchMap(() => this._drag$)
    )

    combineLatest(
      this.showProperties$,
      offsetObs$,
    ).pipe(
      filter(v => v[0]),
      map(v => v[1]),
      scan((acc, curr) => {
        const { startY } = acc
        const { screenY } = curr.touches[0]
        return {
          startY: startY || screenY,
          totalDeltaY: screenY - (startY || 0)
        }
      }, {
        startY: null,
        totalDeltaY: 0
      }),
      takeUntil(this._onDestroySubject),
    ).subscribe(v => {
      const deltaY = v.totalDeltaY
      const cellHeight = this.menuContainer && this.tunableProperties && this.tunableProperties.length > 0 && this.menuContainer.nativeElement.offsetHeight / this.tunableProperties.length
      const adjHeight = - this.focusedIndex * cellHeight - cellHeight * 0.5

      const min = - cellHeight * 0.5
      const max = - this.tunableProperties.length * cellHeight + cellHeight * 0.5
      const finalYTranslate = clamp(adjHeight + deltaY, min, max )
      this.menuTransform = `translate(0px, ${finalYTranslate}px)`
    })

    this.showProperties$.pipe(
      takeUntil(this._onDestroySubject),
      filter(v => !v),
    ).subscribe(() => {
      if (this.focusItemIndex >= 0) {
        this._focusedProperties = this.tunableProperties[this.focusItemIndex]
      }
    })

    this.showDelta$.pipe(
      tap(flag => {
        this.highlightedSubmenu$.next(this.focusedProperty.values[0])
        if (!flag && !!this.subMenuIxObs) {
          this.subMenuIxObs.disconnect()
          this.subMenuIxObs = null
        }
      }),
      filter(v => !!v),
      // when options show again, options may have changed, so need to recalculate
      tap(() => {
        this.setValueContainerClampStart = null
        this.setValueContainerWidth = null
        this.setValueContainerClampEnd = null
        this.setValueContainerOffset = null
      }), 
      switchMapTo(this._drag$.pipe(
        scan((acc, curr) => {
          const { startX } = acc
          const { screenX } = curr.touches[0]
          return {
            startX: startX || screenX,
            totalDeltaX: screenX - (startX  || 0)
          }
        }, {
          startX: null,
          totalDeltaX: 0
        })
      )),
      takeUntil(this._onDestroySubject)
    ).subscribe(({ totalDeltaX }) => {
      if (!this.subMenuIxObs && this.subMenuIx) {
        this.subMenuIxObs = new IntersectionObserver(ixs => {
          const ix = ixs.find(({ intersectionRatio }) => intersectionRatio < 0.7)
          if (!ix) return console.log(ixs)
          const value = ix.target.getAttribute('data-submenu-value')
          this.highlightedSubmenu$.next(value)
        }, {
          root: this.subMenuIx.nativeElement,
          threshold: [ 0.1, 0.3, 0.5, 0.7, 0.9 ]
        })

        for (const btn of this.setValueContainer.nativeElement.children) {
          this.subMenuIxObs.observe(btn)
        }
      }
      if (!this.setValueContainerWidth) {
        if (!this.setValueContainer) return
        if (this.setValueContainer.nativeElement.children.length === 0) return
        const { children, clientWidth } = this.setValueContainer.nativeElement

        this.setValueContainerWidth = clientWidth
        const firstChildWidth = children[0].clientWidth
        const lastChildWidth = children[children.length - 1].clientWidth

        this.setValueContainerOffset = firstChildWidth / -2
        this.setValueContainerClampStart = firstChildWidth / -2
        this.setValueContainerClampEnd = lastChildWidth / 2 - clientWidth
      }
      const actualDeltaX = clamp(totalDeltaX + this.setValueContainerOffset, this.setValueContainerClampStart, this.setValueContainerClampEnd)
      this.subMenuTransform = `translate(${actualDeltaX}px , 0px)`
    })

    this.showDelta$.pipe(
      takeUntil(this._onDestroySubject),
      filter(v => !v)
    ).subscribe(() => this.valueSelected.emit({ selectedProp: this.focusedProperty, value: this.highlightedSubmenu$.value }))
  }

  public highlightedSubmenu$: BehaviorSubject<string> = new BehaviorSubject(null)

  private setValueContainerOffset = null
  private setValueContainerClampEnd = null
  private setValueContainerClampStart = null
  private setValueContainerWidth = null
  public subMenuTransform = `translate(0px, 0px)`
  public menuTransform = `translate(0px, 0px)`

  public focusItemIndex: number = 0

}
