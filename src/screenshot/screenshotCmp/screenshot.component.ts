import { Component, HostListener, Inject, OnDestroy, Output, EventEmitter, Optional, ViewChild, TemplateRef } from "@angular/core";
import { MatDialog, MatSnackBar } from 'src/sharedModules/angularMaterial.exports'
import { combineLatest, Observable, Subject, Subscription } from "rxjs";
import { distinctUntilChanged, map, mapTo, shareReplay, startWith, switchMap, switchMapTo } from "rxjs/operators";
import { HANDLE_SCREENSHOT_PROMISE, TypeHandleScrnShotPromise } from "../util";
import { getDateString } from 'common/util'
import { getUuid } from "src/util/fn";

const BORDER_WIDTH = 10000

@Component({
  templateUrl: './screenshot.template.html',
  styleUrls: [
    './screenshot.style.css'
  ]
})

export class ScreenshotCmp implements OnDestroy{

  public borderStyle = `${BORDER_WIDTH}px rgba(0, 0, 0, 0.5) solid`
  private mousedown$ = new Subject<MouseEvent>()
  private mouseup$ = new Subject<MouseEvent>()
  private mousemove$ = new Subject<MouseEvent>()
  private subscriptions: Subscription[] = []

  public isDragging$: Observable<boolean>
  public transformString$: Observable<string>
  public widthString$: Observable<string>
  public heightString$: Observable<string>

  private flipRect$: Observable<{ x: boolean, y: boolean }>

  constructor(
    private dialog: MatDialog,
    private snackbar: MatSnackBar,
    @Optional() @Inject(HANDLE_SCREENSHOT_PROMISE) private handleScreenshotPromise: TypeHandleScrnShotPromise
  ){
    this.isDragging$ = this.mousedown$.pipe(
      switchMapTo(this.mouseup$.pipe(
        mapTo(false),
        startWith(true)
      )),
      distinctUntilChanged(),
    )

    this.flipRect$ = this.mousedown$.pipe(
      switchMap(mousedownEv => this.mousemove$.pipe(
        map(mousemoveEv => {
          return {
            x: mousemoveEv.clientX < mousedownEv.clientX,
            y: mousemoveEv.clientY < mousedownEv.clientY
          }
        })
      )),
      distinctUntilChanged(({ x: oldX, y: oldY }, {x, y}) => oldX === x && oldY === y),
    )

    this.transformString$ = combineLatest([
      this.mousedown$,
      this.flipRect$,
    ]).pipe(
      map(([ev, { x, y }]) => {
        /**
         * scale will retroactively change the effect of previous translations
         */
        const xFactor = x ? -1 : 1
        const yFactor = y ? -1 : 1
        return `translate(${-BORDER_WIDTH * xFactor}px, ${-BORDER_WIDTH * yFactor}px) scale(${xFactor}, ${yFactor}) translate(${(ev.clientX) * (xFactor)}px, ${(ev.clientY) * (yFactor)}px)`
      }),
      shareReplay(1),
    )

    this.subscriptions.push(
      this.transformString$.subscribe()
    )

    const width$ = this.mousedown$.pipe(
      switchMap(ev => this.mousemove$.pipe(
        map(moveEv => Math.abs(moveEv.clientX - ev.clientX)),
        startWith(0),
      )),
      shareReplay(1),
    )

    this.widthString$ = width$.pipe(
      map(width => `${width}px`),
      shareReplay(1),
    )

    this.subscriptions.push(
      this.widthString$.subscribe()
    )

    const height$ = this.mousedown$.pipe(
      switchMap(ev => this.mousemove$.pipe(
        map(moveEv => Math.abs(moveEv.clientY - ev.clientY)),
        startWith(0),
      )),
      shareReplay(1),
    )

    this.heightString$ = height$.pipe(
      map(height => `${height}px`),
      shareReplay(1),
    )

    this.subscriptions.push(
      this.heightString$.subscribe()
    )

    this.subscriptions.push(
      combineLatest([
        this.mousedown$,
        this.flipRect$,
        width$,
        height$,
      ]).pipe(
        switchMap(arg => this.mouseup$.pipe(
          mapTo(arg)
        ))
      ).subscribe(([ startEv, flipRect, width, height ]) => {
        const startX = startEv.clientX
        const startY = startEv.clientY
        if (!handleScreenshotPromise) {
          console.warn(`HANDLE_SCREENSHOT_PROMISE not provided`)
          return
        }

        if (width < 5 || height < 5) {
          snackbar.open('width and height needs to be a bit larger', null, {
            duration: 1000
          })
          return
        }

        this.captureScreenshot({
          x: flipRect.x ? startX - width : startX,
          y: flipRect.y ? startY - height : startY,
          width,
          height
        })
      })
    )
  }

  captureScreenshot(param?){

    this.handleScreenshotPromise(param)
      .then(({ revoke, url }) => {
        this.dialog.open(
          this.previewTmpl,
          {
            data: {
              url,
              download: `${getDateString()}_${getUuid()}.png`
            }
          }
        ).afterClosed().subscribe(
          reason => {
            /**
             * if user clicks outside, or clicks cancel, emit destroy signal
             */
            if (!reason || reason === 'cancel') {
              this.destroy.emit()
            }
            revoke()
          }
        )
      })
      .catch(e => {
        this.snackbar.open(e, 'Dismiss')
      })
  }

  ngOnDestroy(){
    while(this.subscriptions.length > 0) this.subscriptions.pop().unsubscribe()
  }

  @HostListener('mousedown', ['$event'])
  mousedown(ev: MouseEvent){
    this.mousedown$.next(ev)
  }

  @HostListener('mouseup', ['$event'])
  mouseup(ev: MouseEvent){
    this.mouseup$.next(ev)
  }

  @HostListener('mousemove', ['$event'])
  mousemove(ev: MouseEvent){
    this.mousemove$.next(ev)
  }

  @Output()
  destroy = new EventEmitter()

  @ViewChild('previewTmpl', { read: TemplateRef })
  private previewTmpl: TemplateRef<any>
}