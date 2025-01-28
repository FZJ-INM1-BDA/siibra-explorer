import { ChangeDetectorRef, Component, Inject, OnDestroy } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { combineLatest, fromEvent, merge, Observable, of, Subject, Subscription } from "rxjs";
import { atlasSelection, userInterface } from "src/state";
import { NehubaViewerUnit } from "../../nehubaViewer/nehubaViewer.component";
import { NEHUBA_INSTANCE_INJTKN, takeOnePipe, getFourPanel, getHorizontalOneThree, getSinglePanel, getPipPanel, getVerticalOneThree } from "../../util";
import { QUICKTOUR_DESC, QUICKTOUR_DESC_MD, ARIA_LABELS, IDS } from 'common/constants'
import { IQuickTourData } from "src/ui/quickTour/constrants";
import { debounceTime, distinctUntilChanged, map, mapTo, switchMap, take } from "rxjs/operators";
import {panelOrder} from "src/state/userInterface/selectors";
import { switchMapWaitFor } from "src/util/fn";
import { NEHUBA_CONFIG_SERVICE_TOKEN, NehubaConfigSvc } from "../../config.service";

@Component({
  selector: `nehuba-layout-overlay`,
  templateUrl: `./nehuba.layoutOverlay.template.html`,
  styleUrls: [
    `./nehuba.layoutOverlay.style.css`
  ]
})

export class NehubaLayoutOverlay implements OnDestroy{

  public ARIA_LABELS = ARIA_LABELS
  public IDS = IDS
  public currentPanelMode: userInterface.PanelMode = "FOUR_PANEL"
  public currentOrder: string = '0123'
  public currentHoveredIndex: number

  public quickTourSliceViewSlide: IQuickTourData = {
    order: 1,
    description: QUICKTOUR_DESC.SLICE_VIEW,
    descriptionMd: QUICKTOUR_DESC_MD.SLICE_VIEW
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

  handleCycleViewEvent(): void {
    if (!["SINGLE_PANEL", 'PIP_PANEL'].includes(this.currentPanelMode)) return
    this.store$.dispatch(
      userInterface.actions.cyclePanelMode()
    )
  }

  public toggleMaximiseMinimise(index: number): void {
    this.store$.dispatch(
      userInterface.actions.toggleMaximiseView({
        targetIndex: index
      })
    )
  }

  public zoomNgView(panelIndex: number, factor: number): void {
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

  setQuickTourPos(): void {
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

  public panelMode$ = this.store$.pipe(
    select(userInterface.selectors.panelMode),
    map(v => v || "FOUR_PANEL")
  )

  public panelOrder$ = this.store$.pipe(
    select(userInterface.selectors.panelOrder),
    map(v => v || "0123")
  )

  public volumeChunkLoading$: Subject<boolean> = new Subject()

  public showPipPerspectiveView$ = this.store$.pipe(
    select(panelOrder),
    map(v => v || "0123"),
    distinctUntilChanged(),
    map(po => po[0] !== '3')
  )

  constructor(
    private store$: Store,
    private cdr: ChangeDetectorRef,
    @Inject(NEHUBA_INSTANCE_INJTKN) nehuba$: Observable<NehubaViewerUnit>,
    @Inject(NEHUBA_CONFIG_SERVICE_TOKEN) private nehubaConfigSvc: NehubaConfigSvc,
  ){
    this.subscription.push(
      nehuba$.subscribe(nehuba => {
        this.nehubaUnit = nehuba
        this.onNewNehubaUnit(nehuba)
        this.setQuickTourPos()
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
      ).pipe(
        map(ev => {
          const { missingImageChunks, missingChunks } = ev.detail
          return { missingImageChunks, missingChunks }
        }),
        distinctUntilChanged((o, n) => o.missingChunks === n.missingChunks && o.missingImageChunks === n.missingImageChunks)
      ).subscribe(({ missingImageChunks, missingChunks }) => {
        this.volumeChunkLoading$.next(
          missingImageChunks > 0 || missingChunks > 0
        )
        this.detectChanges()
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
        switchMap(
          switchMapWaitFor({
            leading: true,
            interval: 16,
            condition: () => "0123".split("").every(v => !!this.nehubaViewPanels[Number(v)])
          })
        )
      ).subscribe(([mode, panelOrder]) => {

        this.currentPanelMode = mode as userInterface.PanelMode
        this.currentOrder = panelOrder

        const viewPanels = panelOrder.split('').map(v => Number(v)).map(idx => this.nehubaViewPanels[idx]) as [HTMLElement, HTMLElement, HTMLElement, HTMLElement]

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
        case "PIP_PANEL": {
          const element = removeExistingPanels()
          const newEl = getPipPanel(viewPanels)
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

  public detectChanges(): void {
    this.cdr.detectChanges()
  }

  public async resetZoom(panelIndex: number){
    const { template } = await this.store$.pipe(
      atlasSelection.fromRootStore.distinctATP(),
      take(1)
    ).toPromise()
    const config = this.nehubaConfigSvc.getNehubaConfig(template)
    
    const {
      perspectiveZoom,
      navigation,
    } = config.dataset.initialNgState
    const { zoomFactor: zoom } = navigation
    
    this.store$.dispatch(
      atlasSelection.actions.navigateTo({
        navigation: panelIndex === 3 ? ({ perspectiveZoom }) : ({ zoom }),
        animation: false
      })
    )
  }

  private nehubaUnit: NehubaViewerUnit

  private findPanelIndex = (panel: HTMLElement) => this.viewPanelWeakMap.get(panel)
  private viewPanelWeakMap = new WeakMap<HTMLElement, number>()
  private nehubaViewPanels: HTMLElement[] = []

  private subscription: Subscription[] = []
  private nehubaUnitSubs: Subscription[] = []

  private nanometersToOffsetPixelsFn: ((...arg: any[]) => any)[] = []
}