import { Directive, ElementRef, Inject, Input, OnDestroy } from "@angular/core";
import { Observable, fromEvent, merge, Subscription } from "rxjs";
import { map, filter, shareReplay, switchMap, pairwise, takeUntil, switchMapTo } from "rxjs/operators";
import { getExportNehuba } from 'src/util/fn'
import { computeDistance, NehubaViewerUnit } from "../nehubaViewer/nehubaViewer.component";
import { NEHUBA_INSTANCE_INJTKN, takeOnePipe } from "../util";

@Directive({
  selector: '[iav-viewer-touch-interface]',
  exportAs: 'iavNehubaViewerTouch'
})

export class NehubaViewerTouchDirective implements OnDestroy{

  @Input('iav-viewer-touch-interface-vp-to-data')
  viewportToData: any[] = []

  get ngViewer(){
    return this.nehubaUnit?.nehubaViewer?.ngviewer
  }

  private touchMove$: Observable<any>
  private singleTouchStart$: Observable<TouchEvent>
  private touchEnd$: Observable<TouchEvent>
  private multiTouchStart$: Observable<any>

  public translate$: Observable<any>

  private nehubaUnit: NehubaViewerUnit
  private findPanelIndex(panel: HTMLElement){
    if (!this.nehubaUnit) return null
    return Array.from(this.nehubaUnit?.nehubaViewer?.ngviewer?.display?.panels || []).indexOf(panel)
  }

  private _exportNehuba: any
  private get exportNehuba(){
    if (!this._exportNehuba) {
      this._exportNehuba = getExportNehuba()
    }
    return this._exportNehuba
  }

  private s: Subscription[] = []
  private nehubaSub: Subscription[] = []

  constructor(
    private el: ElementRef,
    @Inject(NEHUBA_INSTANCE_INJTKN) nehuba$: Observable<NehubaViewerUnit>
  ){
    if (nehuba$) {

      this.s.push(
        nehuba$.subscribe(unit => {
          this.nehubaUnit = unit
          this.onNewNehubaUnit(unit)
        })
      )
    }
    /**
     * Touchend also needs to be listened to, as user could start
     * with multitouch, and end up as single touch
     */
    const touchStart$ = fromEvent(this.el.nativeElement, 'touchstart').pipe(
      shareReplay(1),
    )
    this.singleTouchStart$ = merge(
      touchStart$,
      fromEvent(this.el.nativeElement, 'touchend')
    ).pipe(
      filter((ev: TouchEvent) => ev.touches.length === 1),
      shareReplay(1),
    )

    this.multiTouchStart$ = touchStart$.pipe(
      filter((ev: TouchEvent) => ev.touches.length > 1),
    )

    this.touchEnd$ = fromEvent(this.el.nativeElement, 'touchend').pipe(
      map(ev => ev as TouchEvent),
    )

    this.touchMove$ = fromEvent(this.el.nativeElement, 'touchmove')

    const multiTouch$ = this.multiTouchStart$.pipe(
      // only tracks first 2 touches
      map((ev: TouchEvent) => [ this.findPanelIndex(ev.touches[0].target as HTMLElement), this.findPanelIndex(ev.touches[0].target as HTMLElement) ]),
      filter(indicies => indicies[0] >= 0 && indicies[0] === indicies[1]),
      map(indicies => indicies[0]),
      switchMap(panelIndex => fromEvent(this.el.nativeElement, 'touchmove').pipe(
        filter((ev: TouchEvent) => ev.touches.length > 1),
        pairwise(),
        map(([ev0, ev1]) => {
          return {
            panelIndex,
            ev0,
            ev1
          }
        }),
        takeUntil(this.touchEnd$.pipe(
          filter(ev => ev.touches.length < 2)
        ))
      )),
      shareReplay(1)
    )

    const multitouchSliceView$ = multiTouch$.pipe(
      filter(({ panelIndex }) => panelIndex < 3)
    )

    const multitouchPerspective$ = multiTouch$.pipe(
      filter(({ panelIndex }) => panelIndex === 3)
    )

    const rotationByMultiTouch$ = multitouchSliceView$

    const zoomByMultiTouch$ = multitouchSliceView$.pipe(
      map(({ ev1, ev0 }) => {
        const d1 = computeDistance(
          [ev0.touches[0].screenX, ev0.touches[0].screenY],
          [ev0.touches[1].screenX, ev0.touches[1].screenY],
        )
        const d2 = computeDistance(
          [ev1.touches[0].screenX, ev1.touches[0].screenY],
          [ev1.touches[1].screenX, ev1.touches[1].screenY],
        )
        const factor = d1 / d2
        return factor
      })
    )

    const translateByMultiTouch$ = multitouchSliceView$.pipe(
      map(({ ev0, ev1, panelIndex }) => {

        const av0X = (ev0.touches[0].screenX + ev0.touches[1].screenX) / 2
        const av0Y = (ev0.touches[0].screenY + ev0.touches[1].screenY) / 2

        const av1X = (ev1.touches[0].screenX + ev1.touches[1].screenX) / 2
        const av1Y = (ev1.touches[0].screenY + ev1.touches[1].screenY) / 2

        const deltaX = av0X - av1X
        const deltaY = av0Y - av1Y
        return {
          panelIndex,
          deltaX,
          deltaY
        }
      }),
    )

    const translateBySingleTouch$ = this.singleTouchStart$.pipe(
      map(ev => this.findPanelIndex(ev.target as HTMLElement)),
      filter(panelIndex => !!this.ngViewer && panelIndex >= 0 && panelIndex < 3),
      switchMap(panelIndex => this.touchMove$.pipe(
        pairwise(),
        map(([ ev0, ev1 ]: [TouchEvent, TouchEvent]) => {
          const deltaX = ev0.touches[0].screenX - ev1.touches[0].screenX
          const deltaY = ev0.touches[0].screenY - ev1.touches[0].screenY
          return {
            panelIndex,
            deltaX,
            deltaY
          }
        }),
        takeUntil(
          merge(
            this.touchEnd$,
            this.multiTouchStart$
          )
        )
      ))
    )

    const changePerspectiveView$ = this.singleTouchStart$.pipe(
      map(ev => this.findPanelIndex(ev.target as HTMLElement)),
      filter(panelIndex => panelIndex === 3 ),
      switchMapTo(this.touchMove$.pipe(
        pairwise(),
        map(([ev0, ev1]) => {
          return { ev0, ev1 }
        }),
        takeUntil(
          merge(
            this.touchEnd$,
            this.multiTouchStart$
          )
        ),
      )),
    )

    this.s.push(
      changePerspectiveView$.subscribe(({ ev1, ev0 }) => {
        const { perspectiveNavigationState } = this.ngViewer

        const { vec3 } = this.exportNehuba

        const deltaX = ev0.touches[0].screenX - ev1.touches[0].screenX
        const deltaY = ev0.touches[0].screenY - ev1.touches[0].screenY
        perspectiveNavigationState.pose.rotateRelative(vec3.fromValues(0, 1, 0), -deltaX / 4.0 * Math.PI / 180.0)
        perspectiveNavigationState.pose.rotateRelative(vec3.fromValues(1, 0, 0), deltaY / 4.0 * Math.PI / 180.0)
        perspectiveNavigationState.changed.dispatch()
      }),
      multitouchPerspective$.subscribe(({ ev1, ev0 }) => {
        const d1 = computeDistance(
          [ev0.touches[0].screenX, ev0.touches[0].screenY],
          [ev0.touches[1].screenX, ev0.touches[1].screenY],
        )
        const d2 = computeDistance(
          [ev1.touches[0].screenX, ev1.touches[0].screenY],
          [ev1.touches[1].screenX, ev1.touches[1].screenY],
        )
        const factor = d1 / d2
        const { minZoom = null, maxZoom = null } = {}
        const { zoomFactor } = this.ngViewer.perspectiveNavigationState
        if (!!minZoom && zoomFactor.value * factor < minZoom) { return }
        if (!!maxZoom && zoomFactor.value * factor > maxZoom) { return }
        zoomFactor.zoomBy(factor)
      }),
      rotationByMultiTouch$.subscribe(({ panelIndex, ev0, ev1 }) => {
        
        const dY0 = ev0.touches[1].screenY - ev0.touches[0].screenY
        const dX0 = ev0.touches[1].screenX - ev0.touches[0].screenX
        const m0 = dY0 / dX0

        const dY1 = ev1.touches[1].screenY - ev1.touches[0].screenY
        const dX1 = ev1.touches[1].screenX - ev1.touches[0].screenX
        const m1 = dY1 / dX1

        const theta = Math.atan( (m1 - m0) / ( 1 + m1 * m0 ) )
        if (isNaN(theta)) return
        
        const { vec3 } = this.exportNehuba

        const axis = vec3.fromValues(
          ...[
            [0, -1, 0],
            [1, 0, 0],
            [0, 0, 1]
          ][panelIndex]
        )

        this.ngViewer.navigationState.pose.rotateRelative(axis, theta)
      }),
      zoomByMultiTouch$.subscribe(factor => {
        if (isNaN(factor)) return
        this.ngViewer.navigationState.zoomBy(factor)
      }),
      merge(
        translateBySingleTouch$,
        translateByMultiTouch$,
      ).subscribe(({ panelIndex, deltaX, deltaY }) => {
        if (isNaN(deltaX) || isNaN(deltaX)) return
        const { position } = this.ngViewer.navigationState
        const pos = position.spatialCoordinates
        this.exportNehuba.vec3.set(pos, deltaX, deltaY, 0)
        this.exportNehuba.vec3.transformMat4(pos, pos, this.viewportToData[panelIndex])

        position.changed.dispatch()
      })
    )
  }

  private onNewNehubaUnit(nehubaUnit: NehubaViewerUnit) {
    while (this.nehubaSub.length > 0) this.nehubaSub.pop().unsubscribe()

    if (!nehubaUnit) return

    this.nehubaSub.push(
      fromEvent<CustomEvent>(
        nehubaUnit.elementRef.nativeElement,
        'viewportToData'
      ).pipe(
        takeOnePipe()
      ).subscribe((events: CustomEvent[]) => {
        [0, 1, 2].forEach(idx => this.viewportToData[idx] = events[idx].detail.viewportToData)
      })
    )
  }

  ngOnDestroy(){
    while(this.s.length > 0){
      this.s.pop().unsubscribe()
    }
    while (this.nehubaSub.length > 0) this.nehubaSub.pop().unsubscribe()
  }
}
