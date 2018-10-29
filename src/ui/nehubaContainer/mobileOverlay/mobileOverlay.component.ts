import { Component, Input, Output,EventEmitter, ElementRef, ViewChild, AfterViewInit, ChangeDetectionStrategy, OnDestroy } from "@angular/core";
import { fromEvent, Subject, Observable, merge, concat, of, combineLatest } from "rxjs";
import { map, switchMap, takeUntil, filter, scan, take } from "rxjs/operators";

@Component({
  selector : 'mobile-overlay',
  templateUrl : './mobileOverlay.template.html',
  styleUrls : [
    './mobileOverlay.style.css'
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
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class MobileOverlay implements AfterViewInit, OnDestroy{
  @Input() tunableProperties : string [] = []
  @Output() deltaValue : EventEmitter<{delta:number, selectedProp : string}> = new EventEmitter() 
  @ViewChild('initiator', {read: ElementRef}) initiator : ElementRef
  @ViewChild('mobileMenuContainer', {read: ElementRef}) menuContainer : ElementRef

  private _onDestroySubject : Subject<boolean> = new Subject()

  private _focusedProperties : string
  get focusedProperty(){
    return this._focusedProperties
      ? this._focusedProperties
      : this.tunableProperties[0]
  }

  public showScreen$ : Observable<boolean>
  public showProperties$ : Observable<boolean>
  private _drag$ : Observable<any>

  ngOnDestroy(){
    this._onDestroySubject.next(true)
    this._onDestroySubject.complete()
  }

  ngAfterViewInit(){

    this.showScreen$ = merge(
      fromEvent(this.initiator.nativeElement, 'touchstart'),
      fromEvent(this.initiator.nativeElement, 'touchend'),
    ).pipe(
      map((ev:TouchEvent) => ev.touches.length === 1)
    )

    this._drag$ = fromEvent(this.initiator.nativeElement, 'touchmove').pipe(
      takeUntil(fromEvent(this.initiator.nativeElement, 'touchend').pipe(
        filter((ev:TouchEvent) => ev.touches.length === 0)
      )),
      map((ev:TouchEvent) => (ev.preventDefault(), ev.stopPropagation(), ev)),
      filter((ev:TouchEvent) => ev.touches.length === 1),
      scan((acc,curr) => acc.length < 2
        ? acc.concat(curr)
        : acc.slice(1).concat(curr), []),
      filter(ev => ev.length === 2)
    )

    this.showProperties$ = fromEvent(this.initiator.nativeElement, 'touchstart').pipe(    
      switchMap(() => concat(
        this._drag$.pipe(
          map(double => ({
            deltaX : double[1].touches[0].screenX - double[0].touches[0].screenX,
            deltaY : double[1].touches[0].screenY - double[0].touches[0].screenY
          })),
          scan((acc, _curr) => acc),
          map(v => v.deltaY ** 2 > v.deltaX ** 2)
        ),
        of(false)
        )
      )
    )

    fromEvent(this.initiator.nativeElement, 'touchstart').pipe(
      switchMap(() => this._drag$.pipe(
        map(double => ({
          deltaX : double[1].touches[0].screenX - double[0].touches[0].screenX,
          deltaY : double[1].touches[0].screenY - double[0].touches[0].screenY
        })),
        scan((acc, curr:any) => ({
          pass: acc.pass === null
            ? curr.deltaX ** 2 > curr.deltaY ** 2
            : acc.pass,
          delta: curr.deltaX
        }), {
          pass: null,
          delta : null
        }),
        filter(ev => ev.pass),
        map(ev => ev.delta)
      )),
      takeUntil(this._onDestroySubject)
    ).subscribe(ev => this.deltaValue.emit({
      delta : ev,
      selectedProp : this.focusedProperty
    }))

    const offsetObs$ = fromEvent(this.initiator.nativeElement, 'touchstart').pipe(
      switchMap(() => concat(
        this._drag$.pipe(
          scan((acc,curr) => [acc[0], curr[1]]),
          map(double => ({
            deltaX : double[1].touches[0].screenX - double[0].touches[0].screenX,
            deltaY : double[1].touches[0].screenY - double[0].touches[0].screenY
          })),
        )
      ))
    )
    combineLatest(
      this.showProperties$,
      offsetObs$
    ).pipe(
      filter(v => v[0]),
      map(v => v[1]),
      takeUntil(this._onDestroySubject)
    ).subscribe(v => this.scrollHeight = v.deltaY)

    this.showProperties$.pipe(
      takeUntil(this._onDestroySubject),
      filter(v => !v)
    ).subscribe(() => {
      if(this.focusItemIndex >= 0){
        this._focusedProperties = this.tunableProperties[this.focusItemIndex]
      }
      this.scrollHeight = 0
    })
  }

  scrollHeight : number = 0

  get defaultY(){
    return this.tunableProperties.findIndex(p => p === this.focusedProperty) * this.menuCellHeight
  }

  get menuTransform(){
    return `translate(0px, ${this.menuYTranslate}px)`
  }

  get menuYTranslate(){
    return this.menuContainer
      ? Math.max(
          Math.min(
            this.defaultY + this.scrollHeight, 
            this.menuContainerHeight / 2 - this.menuCellHeight / 2
            ),
          - this.menuContainerHeight / 2 + this.menuCellHeight / 2
          )
      : this.defaultY
  }

  get menuContainerHeight(){
    return this.menuContainer
      ? this.menuContainer.nativeElement.offsetHeight
      : 0
  }

  get menuCellHeight(){
    return this.tunableProperties.length > 0
      ? this.menuContainerHeight / this.tunableProperties.length
      : 0
  }

  get focusItemIndex():number{
    return this.menuContainer
      ? Math.floor((this.menuContainerHeight / 2 - this.menuYTranslate) / this.menuCellHeight)
      : -1
  }
}