import { ChangeDetectorRef, Component, Inject, OnDestroy } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { combineLatest, EMPTY, fromEvent, merge, Observable, of, Subject, Subscription } from "rxjs";
import { atlasSelection, userInterface } from "src/state";
import { NehubaViewerUnit } from "../../nehubaViewer/nehubaViewer.component";
import { NEHUBA_INSTANCE_INJTKN, takeOnePipe, getFourPanel, getHorizontalOneThree, getSinglePanel, getPipPanel, getVerticalOneThree } from "../../util";
import { QUICKTOUR_DESC, QUICKTOUR_DESC_MD, ARIA_LABELS, IDS, VALUES } from 'common/constants'
import { IQuickTourData } from "src/ui/quickTour/constrants";
import { debounceTime, distinctUntilChanged, filter, map, mapTo, shareReplay, switchMap, take, withLatestFrom } from "rxjs/operators";
import { panelOrder } from "src/state/userInterface/selectors";
import { getExportNehuba, switchMapWaitFor } from "src/util/fn";
import { NEHUBA_CONFIG_SERVICE_TOKEN, NehubaConfigSvc } from "../../config.service";
import { arrayEqual } from "src/util/array";
import { enLabels } from "src/uiLabels";

const REV_THRESHOLD = 1 - VALUES.THRESHOLD
const NEG_REV_THRESHOLD = VALUES.THRESHOLD - 1

type AxisLabel = Partial<{
  R: number
  L: number
  A: number
  P: number
  S: number
  I: number
}>

const EXPECTED_FLATTENED_AXES: (keyof AxisLabel)[] = ['S', 'R', 'I', 'L', 'S', 'A', 'I', 'P', 'A', 'R', 'P', 'L']

function convertToAxesLabel(array: number[]): AxisLabel {
  if (array[0] > REV_THRESHOLD) {
    return { R: array[0] }
  }
  if (array[0] < NEG_REV_THRESHOLD) {
    return { L: array[0] * -1 }
  }
  if (array[1] > REV_THRESHOLD) {
    return { A: array[1] }
  }
  if (array[1] < NEG_REV_THRESHOLD) {
    return { P: array[1] * -1 }
  }
  if (array[2] > REV_THRESHOLD) {
    return { S: array[2] }
  }
  if (array[2] < NEG_REV_THRESHOLD) {
    return { I: array[2] * -1 }
  }
  return {}
}

@Component({
  selector: `nehuba-layout-overlay`,
  templateUrl: `./nehuba.layoutOverlay.template.html`,
  styleUrls: [
    `./nehuba.layoutOverlay.style.scss`
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
  )

  public panelOrder$ = this.store$.pipe(
    select(userInterface.selectors.panelOrder),
  )

  public volumeChunkLoading$: Subject<boolean> = new Subject()

  public showPipPerspectiveView$ = this.store$.pipe(
    select(panelOrder),
    distinctUntilChanged(),
    map(po => po[0] !== '3')
  )
  
  #exportNehuba = getExportNehuba()

  labels$ = of(enLabels)

  axesLabels$: Observable<AxisLabel[][]> = this.nehuba$.pipe(
    switchMap(nehuba => nehuba
      ? nehuba.viewerPositionChange.pipe(
          map(v => v?.orientation || [] as number[]),
        )
      : EMPTY),
    distinctUntilChanged(arrayEqual(null, true)),
    filter(arr => arr.length === 4),
    withLatestFrom(this.#exportNehuba),
    map(([orientation, export_nehuba]) => {
      const { vec3, quat } = export_nehuba

      const slicesOrientations = [
        quat.rotateX(quat.create(), quat.create(), -Math.PI / 2),
        quat.rotateY(quat.create(), quat.rotateX(quat.create(), quat.create(), -Math.PI / 2), -Math.PI / 2),
        quat.rotateX(quat.create(), quat.create(), Math.PI),
      ]
      for (const q of slicesOrientations){
        quat.mul(q, orientation, q)
      }

      const xp = vec3.fromValues(1, 0, 0)
      const yp = vec3.fromValues(0, 1, 0)
      const xn = vec3.fromValues(-1, 0, 0)
      const yn = vec3.fromValues(0, -1, 0)


      return slicesOrientations.map(q => {

        // origin **might** be at top left, rather than bottom left
        const xpt = vec3.transformQuat(vec3.create(), xp, q)
        const xnt = vec3.transformQuat(vec3.create(), xn, q)

        const ypt = vec3.transformQuat(vec3.create(), yp, q)
        const ynt = vec3.transformQuat(vec3.create(), yn, q)

        return [
          convertToAxesLabel(ynt),
          convertToAxesLabel(xpt),
          convertToAxesLabel(ypt),
          convertToAxesLabel(xnt)
        ]
      })
    }),
    shareReplay(1),
  )

  showResetRot$ = this.axesLabels$.pipe(
    map(axisLabels => {
      const obliqueRotated = axisLabels.some(
        axisLabel => axisLabel.some(
          label => Object.keys(label).length === 0
        )
      )
      if (obliqueRotated) {
        return true
      }

      const flattened = axisLabels
        .flatMap(l => l)
        .map(v => Object.keys(v))
        .flatMap(l => l)

      return !arrayEqual(null, true)(flattened, EXPECTED_FLATTENED_AXES)
    })
  )

  async turn90(axis: AxisLabel){
    const { orientation } = await this.store$.pipe(
      select(atlasSelection.selectors.navigation),
      take(1)
    ).toPromise()

    const { quat } = await this.#exportNehuba
    const newOrientation = quat.clone(orientation)

    for (const key in axis){
      if (key === "S") {
        quat.rotateZ(newOrientation, orientation, Math.PI / 2)
        continue
      }
      if (key === "I") {
        quat.rotateZ(newOrientation, orientation, - Math.PI / 2)
        continue
      }
      if (key === "A") {
        quat.rotateY(newOrientation, orientation, Math.PI / 2)
        continue
      }
      if (key === "P") {
        quat.rotateY(newOrientation, orientation, -Math.PI / 2)
        continue
      }
      if (key === "R") {
        quat.rotateX(newOrientation, orientation, Math.PI / 2)
        continue
      }
      if (key === "L") {
        quat.rotateX(newOrientation, orientation, -Math.PI / 2)
        continue
      }
    }
    
    this.store$.dispatch(
      atlasSelection.actions.navigateTo({
        navigation: {
          orientation: Array.from(newOrientation)
        },
        animation: true
      })
    )
  }

  constructor(
    private store$: Store,
    private cdr: ChangeDetectorRef,
    @Inject(NEHUBA_INSTANCE_INJTKN) private nehuba$: Observable<NehubaViewerUnit>,
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

  public resetOrientation(){
    this.store$.dispatch(
      atlasSelection.actions.navigateTo({
        navigation: {
          orientation: [0, 0, 0, 1]
        },
        animation: true
      })
    )
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
    } = config.dataset.initialNgState as any
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