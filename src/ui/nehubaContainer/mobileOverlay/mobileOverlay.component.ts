import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from "@angular/core";
import { combineLatest, concat, fromEvent, merge, Observable, of, Subject } from "rxjs";
import { filter, map, scan, switchMap, takeUntil } from "rxjs/operators";
import { clamp } from "src/util/generator";

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
  @Input() public tunableProperties: string [] = []
  @Output() public deltaValue: EventEmitter<{delta: number, selectedProp: string}> = new EventEmitter()
  @ViewChild('initiator', {read: ElementRef, static: true}) public initiator: ElementRef
  @ViewChild('mobileMenuContainer', {read: ElementRef, static: true}) public menuContainer: ElementRef
  @ViewChild('intersector', {read: ElementRef, static: true}) public intersector: ElementRef

  private _onDestroySubject: Subject<boolean> = new Subject()

  private _focusedProperties: string
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

  public showScreen$: Observable<boolean>
  public showProperties$: Observable<boolean>
  public showDelta$: Observable<boolean>
  public showInitiator$: Observable<boolean>
  private _drag$: Observable<any>
  private intersectionObserver: IntersectionObserver

  public ngOnDestroy() {
    this._onDestroySubject.next(true)
    this._onDestroySubject.complete()
  }

  public ngOnInit() {

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

    const scanDragScanAccumulator: (acc: TouchEvent[], item: TouchEvent, idx: number) => TouchEvent[] = (acc, curr) => acc.length < 2
      ? acc.concat(curr)
      : acc.slice(1).concat(curr)

    this._drag$ = fromEvent(this.initiator.nativeElement, 'touchmove').pipe(
      takeUntil(fromEvent(this.initiator.nativeElement, 'touchend').pipe(
        filter((ev: TouchEvent) => ev.touches.length === 0),
      )),
      map((ev: TouchEvent) => (ev.preventDefault(), ev.stopPropagation(), ev)),
      filter((ev: TouchEvent) => ev.touches.length === 1),
      scan(scanDragScanAccumulator, []),
      filter(ev => ev.length === 2),
    )

    this.showProperties$ = concat(
      of(false),
      fromEvent(this.initiator.nativeElement, 'touchstart').pipe(
        switchMap(() => concat(
          this._drag$.pipe(
            map(double => ({
              deltaX : double[1].touches[0].screenX - double[0].touches[0].screenX,
              deltaY : double[1].touches[0].screenY - double[0].touches[0].screenY,
            })),
            scan((acc, _curr) => acc),
            map(v => v.deltaY ** 2 > v.deltaX ** 2),
          ),
          of(false),
        )),
      ),
    )

    this.showDelta$ = concat(
      of(false),
      fromEvent(this.initiator.nativeElement, 'touchstart').pipe(
        switchMap(() => concat(
          this._drag$.pipe(
            map(double => ({
              deltaX : double[1].touches[0].screenX - double[0].touches[0].screenX,
              deltaY : double[1].touches[0].screenY - double[0].touches[0].screenY,
            })),
            scan((acc, _curr) => acc),
            map(v => v.deltaX ** 2 > v.deltaY ** 2),
          ),
          of(false),
        )),
      ),
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

    fromEvent(this.initiator.nativeElement, 'touchstart').pipe(
      switchMap(() => this._drag$.pipe(
        map(double => ({
          deltaX : double[1].touches[0].screenX - double[0].touches[0].screenX,
          deltaY : double[1].touches[0].screenY - double[0].touches[0].screenY,
        })),
        scan((acc, curr: any) => ({
          pass: acc.pass === null
            ? curr.deltaX ** 2 > curr.deltaY ** 2
            : acc.pass,
          delta: curr.deltaX,
        }), {
          pass: null,
          delta : null,
        }),
        filter(ev => ev.pass),
        map(ev => ev.delta),
      )),
      takeUntil(this._onDestroySubject),
    ).subscribe(ev => this.deltaValue.emit({
      delta : ev,
      selectedProp : this.focusedProperty,
    }))

    const offsetObs$ = fromEvent(this.initiator.nativeElement, 'touchstart').pipe(
      switchMap(() => concat(
        this._drag$.pipe(
          scan((acc, curr) => [acc[0], curr[1]]),
          map(double => ({
            deltaX : double[1].touches[0].screenX - double[0].touches[0].screenX,
            deltaY : double[1].touches[0].screenY - double[0].touches[0].screenY,
          })),
        ),
      )),
    )
    combineLatest(
      this.showProperties$,
      offsetObs$,
    ).pipe(
      filter(v => v[0]),
      map(v => v[1]),
      takeUntil(this._onDestroySubject),
    ).subscribe(v => {
      const deltaY = v.deltaY
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

  }

  public menuTransform = `translate(0px, 0px)`

  public focusItemIndex: number = 0

}
