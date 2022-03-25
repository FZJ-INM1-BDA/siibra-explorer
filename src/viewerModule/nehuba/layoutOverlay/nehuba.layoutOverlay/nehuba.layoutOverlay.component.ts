import { AfterViewInit, ChangeDetectorRef, Component, Inject, OnDestroy } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { combineLatest, fromEvent, interval, merge, Observable, of, Subject, Subscription, timer } from "rxjs";
import { userInterface } from "src/state";
import { NehubaViewerUnit } from "../../nehubaViewer/nehubaViewer.component";
import { NEHUBA_INSTANCE_INJTKN, takeOnePipe, getFourPanel, getHorizontalOneThree, getSinglePanel, getVerticalOneThree } from "../../util";
import { QUICKTOUR_DESC, ARIA_LABELS, IDS } from 'common/constants'
import { IQuickTourData } from "src/ui/quickTour/constrants";
import { debounce, debounceTime, filter, mapTo, switchMap, take } from "rxjs/operators";

@Component({
  selector: `nehuba-layout-overlay`,
  templateUrl: `./nehuba.layoutOverlay.template.html`,
  styleUrls: [
    `./nehuba.layoutOverlay.style.css`
  ]
})

export class NehubaLayoutOverlay implements OnDestroy, AfterViewInit{

  public ARIA_LABELS = ARIA_LABELS
  public IDS = IDS
  public currentPanelMode: userInterface.PanelMode = "FOUR_PANEL"
  public currentOrder: string = '0123'
  public currentHoveredIndex: number

  public quickTourSliceViewSlide: IQuickTourData = {
    order: 1,
    description: QUICKTOUR_DESC.SLICE_VIEW,
  }

  public quickTour3dViewSlide: IQuickTourData = {
    order: 2,
    description: QUICKTOUR_DESC.PERSPECTIVE_VIEW,
  }

  public quickTourIconsSlide: IQuickTourData = {
    order: 3,
    description: QUICKTOUR_DESC.VIEW_ICONS,
  }

  ngOnDestroy(): void {
    while(this.subscription.length > 0) this.subscription.pop().unsubscribe()
    while(this.nehubaUnitSubs.length > 0) this.nehubaUnitSubs.pop().unsubscribe()
  }

  ngAfterViewInit(): void {
    this.setQuickTourPos()
  }

  handleCycleViewEvent(){
    if (this.currentPanelMode !== "SINGLE_PANEL") return
    this.store$.dispatch(
      userInterface.actions.cyclePanelMode()
    )
  }

  public toggleMaximiseMinimise(index: number) {
    this.store$.dispatch(
      userInterface.actions.toggleMaximiseView({
        targetIndex: index
      })
    )
  }

  public zoomNgView(panelIndex: number, factor: number) {
    const ngviewer = this.nehubaUnit?.nehubaViewer?.ngviewer
    if (!ngviewer) throw new Error(`ngviewer not defined!`)

    /**
     * panelIndex < 3 === slice view
     */
    if (panelIndex < 3) {
      /**
       * factor > 1 === zoom out
       */
      ngviewer.navigationState.zoomBy(factor)
    } else {
      ngviewer.perspectiveNavigationState.zoomBy(factor)
    }
  }

  public returnTruePos(quadrant: number, data: any) {
    const pos = quadrant > 2
      ? [0, 0, 0]
      : this.nanometersToOffsetPixelsFn && this.nanometersToOffsetPixelsFn[quadrant]
        ? this.nanometersToOffsetPixelsFn[quadrant](data.geometry.position.map(n => n * 1e6))
        : [0, 0, 0]
    return pos
  }

  public getPositionX(quadrant: number, data: any) {
    return this.returnTruePos(quadrant, data)[0]
  }
  public getPositionY(quadrant: number, data: any) {
    return this.returnTruePos(quadrant, data)[1]
  }
  public getPositionZ(quadrant: number, data: any) {
    return this.returnTruePos(quadrant, data)[2]
  }
  public quickTourOverwritingPos = {
    'dialog': {
      left: '0px',
      top: '0px',
    },
    'arrow': {
      left: '0px',
      top: '0px',
    }
  }

  setQuickTourPos(){
    const { innerWidth, innerHeight } = window
    this.quickTourOverwritingPos = {
      'dialog': {
        left: `${innerWidth / 2}px`,
        top: `${innerHeight / 2}px`,
      },
      'arrow': {
        left: `${innerWidth / 2 - 48}px`,
        top: `${innerHeight / 2 - 48}px`,
      }
    }
  }
  public handleMouseEnterCustomLandmark(lm) {
    console.log('handle enter custom landmark')

  }
  public handleMouseLeaveCustomLandmark(_lm) {
    console.log("handle leave custom landmark")
  }

  public panelMode$ = this.store$.pipe(
    select(userInterface.selectors.panelMode)
  )

  public panelOrder$ = this.store$.pipe(
    select(userInterface.selectors.panelOrder),
  )

  public volumeChunkLoading$: Subject<boolean> = new Subject()

  constructor(
    private store$: Store,
    private cdr: ChangeDetectorRef,
    @Inject(NEHUBA_INSTANCE_INJTKN) nehuba$: Observable<NehubaViewerUnit>
  ){
    this.subscription.push(
      nehuba$.subscribe(nehuba => {
        this.nehubaUnit = nehuba
        this.onNewNehubaUnit(nehuba)
      })
    )
  }

  private onNewNehubaUnit(nehubaUnit: NehubaViewerUnit){
    
    while(this.nehubaUnitSubs.length) this.nehubaUnitSubs.pop().unsubscribe()
    this.nehubaViewPanels = []
    this.nanometersToOffsetPixelsFn = []

    if (!nehubaUnit) {
      return
    }

    const removeExistingPanels = () => {
      const element = nehubaUnit.nehubaViewer.ngviewer.layout.container.componentValue.element as HTMLElement
      while (element.childElementCount > 0) {
        element.removeChild(element.firstElementChild)
      }
      return element
    }

    this.nehubaUnitSubs.push(

      /**
       * sliceview loading event
       */
      fromEvent<CustomEvent>(
        nehubaUnit.elementRef.nativeElement,
        'sliceRenderEvent'
      ).subscribe(ev => {
        const { missingImageChunks, missingChunks } = ev.detail
        this.volumeChunkLoading$.next(
          missingImageChunks.length === 0 && missingChunks.length === 0
        )
      }),

      /**
       * map slice view to weakmap
       */
      fromEvent<CustomEvent>(
        nehubaUnit.elementRef.nativeElement,
        'sliceRenderEvent'
      ).pipe(
        takeOnePipe()
      ).subscribe(ev => {
        for (const idx of [0, 1, 2]) {
          const e = ev[idx] as CustomEvent
          const el = e.target as HTMLElement
          this.viewPanelWeakMap.set(el, idx)
          this.nehubaViewPanels[idx] = el
          this.nanometersToOffsetPixelsFn[idx] = e.detail.nanometersToOffsetPixels
        }
      }),


      /**
       * map perspective to weakmap
       */
      fromEvent<CustomEvent>(
        nehubaUnit.elementRef.nativeElement,
        'perpspectiveRenderEvent'
      ).pipe(
        take(1)
      ).subscribe(ev => {
        const perspPanel = ev.target as HTMLElement
        this.nehubaViewPanels[3] = perspPanel
        this.viewPanelWeakMap.set(perspPanel, 3)
      }),

      /**
       * on mouseover, emit hovered panel index
       */
      fromEvent(
        nehubaUnit.elementRef.nativeElement,
        'mouseover'
      ).pipe(
        switchMap((ev: MouseEvent) => merge(
          of(this.findPanelIndex(ev.target as HTMLElement)),
          fromEvent(nehubaUnit.elementRef.nativeElement, 'mouseout').pipe(
            mapTo(null as number),
          ),
        )),
        debounceTime(16),
      ).subscribe(val => {
        this.currentHoveredIndex = val
        this.detectChanges()
      }),

      /**
       * on store change layout, update layout on nehuba
       */
      combineLatest([
        this.panelMode$,
        this.panelOrder$,
      ]).pipe(
        debounce(() => 
          nehubaUnit?.nehubaViewer?.ngviewer
          ? of(true)
          : interval(16).pipe(
              filter(() => nehubaUnit?.nehubaViewer?.ngviewer),
              take(1)
            )
        )
      ).subscribe(([mode, panelOrder]) => {
        
        this.currentPanelMode = mode as userInterface.PanelMode
        this.currentOrder = panelOrder

        const viewPanels = panelOrder.split('').map(v => Number(v)).map(idx => this.nehubaViewPanels[idx]) as [HTMLElement, HTMLElement, HTMLElement, HTMLElement]
  
        /**
         * TODO smarter with event stream
         */
        if (!viewPanels.every(v => !!v)) {
          return
        }
  
        switch (this.currentPanelMode) {
        case "H_ONE_THREE": {
          const element = removeExistingPanels()
          const newEl = getHorizontalOneThree(viewPanels)
          element.appendChild(newEl)
          break;
        }
        case "V_ONE_THREE": {
          const element = removeExistingPanels()
          const newEl = getVerticalOneThree(viewPanels)
          element.appendChild(newEl)
          break;
        }
        case "FOUR_PANEL": {
          const element = removeExistingPanels()
          const newEl = getFourPanel(viewPanels)
          element.appendChild(newEl)
          break;
        }
        case "SINGLE_PANEL": {
          const element = removeExistingPanels()
          const newEl = getSinglePanel(viewPanels)
          element.appendChild(newEl)
          break;
        }
        default:
        }
        for (const panel of viewPanels) {
          (panel as HTMLElement).classList.add('neuroglancer-panel')
        }
  
        this.detectChanges()
        nehubaUnit.redraw()
      })
    )

    this.detectChanges()
  }

  public detectChanges(){
    this.cdr.detectChanges()
  }
  
  private nehubaUnit: NehubaViewerUnit

  private findPanelIndex = (panel: HTMLElement) => this.viewPanelWeakMap.get(panel)
  private viewPanelWeakMap = new WeakMap<HTMLElement, number>()
  private nehubaViewPanels: HTMLElement[] = []

  private subscription: Subscription[] = []
  private nehubaUnitSubs: Subscription[] = []

  private nanometersToOffsetPixelsFn: ((...arg: any[]) => any)[] = []
}