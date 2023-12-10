import { Component, Inject, ViewChild, ChangeDetectionStrategy, inject, HostListener } from "@angular/core";
import { FormControl } from "@angular/forms";
import { select, Store } from "@ngrx/store";
import { BehaviorSubject, combineLatest, concat, merge, NEVER, Observable, of, Subject } from "rxjs";
import { switchMap, distinctUntilChanged, map, debounceTime, shareReplay, take, withLatestFrom, filter, takeUntil } from "rxjs/operators";
import { SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes"
import { selectedTemplate } from "src/state/atlasSelection/selectors";
import { panelMode, panelOrder } from "src/state/userInterface/selectors";
import { ResizeObserverDirective } from "src/util/windowResize";
import { NehubaViewerUnit } from "../../nehubaViewer/nehubaViewer.component";
import { EnumPanelMode } from "../../store/store";
import { NEHUBA_INSTANCE_INJTKN } from "../../util";
import { EnumClassicalView } from "src/atlasComponents/constants"
import { atlasSelection } from "src/state";
import { floatEquality } from "common/util"
import { CURRENT_TEMPLATE_DIM_INFO, TemplateInfo } from "../../layerCtrl.service/layerCtrl.util";
import { DestroyDirective } from "src/util/directives/destroy.directive";
import { isNullish, isWheelEvent } from "src/util/fn"

const MAX_DIM = 200

type AnatomicalOrientation = 'ap' | 'si' | 'rl' // anterior-posterior, superior-inferior, right-left
type RangeOrientation = 'horizontal' | 'vertical'
const anatOriToIdx: Record<AnatomicalOrientation, number> = {
  'rl': 0,
  'ap': 1,
  'si': 2
}
const anaOriAltAxis: Record<AnatomicalOrientation, (tmplSize: [number, number, number], ratio: {x: number, y: number}) => {idx: number, value: number}> = {
  'rl': (tmplSize, { y }) => ({ idx: 2, value: tmplSize[2] * (0.5 - y) }),
  'ap': (tmplSize, { y }) => ({ idx: 2, value: tmplSize[2] * (0.5 - y) }),
  'si': (tmplSize, { x }) => ({ idx: 2, value: tmplSize[0] * (0.5 - x) })
}

function getDim(triplet: number[], view: EnumClassicalView) {
  if (view === EnumClassicalView.AXIAL) {
    return [triplet[0], triplet[1]]
  }
  if (view === EnumClassicalView.CORONAL) {
    return [triplet[0], triplet[2]]
  }
  if (view === EnumClassicalView.SAGITTAL) {
    return [triplet[1], triplet[2]]
  }
}

type ModArr = {
  idx: number
  value: number
}

@Component({
  selector: 'nehuba-perspective-view-slider',
  templateUrl: './perspectiveViewSlider.template.html',
  styleUrls: ['./perspectiveViewSlider.style.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    DestroyDirective,
  ]
})

export class PerspectiveViewSlider {

    #xr = new BehaviorSubject(null)
    #yr = new BehaviorSubject(null)
    #xyRatio = combineLatest([
      this.#xr.pipe(distinctUntilChanged()),
      this.#yr.pipe(distinctUntilChanged()),
    ]).pipe(
      map(([ x, y ]) => ({ x, y }))
    )
    mousemove(ev: MouseEvent){
      this.#mousemove.next(ev)
      const target = (ev.target as HTMLInputElement)
      this.#xr.next(ev.offsetX / target.clientWidth)
      this.#yr.next(ev.offsetY / target.clientHeight)
    }

    #mousemove = new Subject()
    #mousedown = new Subject()
    #mouseup = new Subject()
    #dragging = this.#mousedown.pipe(
      switchMap(() => this.#mousemove.pipe(
        takeUntil(this.#mouseup)
      ))
    )
    mousedown(){
      this.#mousedown.next(true)
    }

    @HostListener('document:mouseup')
    mouseup(){
      this.#mouseup.next(true)
    }

    #zoom = new Subject<number>()
    mousewheel(ev: Event){
      if (!isWheelEvent(ev)) {
        return
      }
      this.#zoom.next(ev.deltaY)
    }

    #destroy$ = inject(DestroyDirective).destroyed$

    @ViewChild(ResizeObserverDirective)
    resizeDirective: ResizeObserverDirective

    public minimapControl = new FormControl<number>(0)
    public recalcViewportSize$ = new Subject()

    private selectedTemplate$ = this.store$.pipe(
      select(selectedTemplate),
      distinctUntilChanged((o, n) => o?.id === n?.id),
    )
    private maximisedPanelIndex$ = combineLatest([
      this.store$.pipe(
        select(panelMode),
        distinctUntilChanged(),
      ),
      this.store$.pipe(
        select(panelOrder),
        distinctUntilChanged(),
      ),
    ]).pipe(
      map(([ mode, order ]) => {
        if (!([EnumPanelMode.PIP_PANEL, EnumPanelMode.SINGLE_PANEL].includes(mode as EnumPanelMode))) {
          return null
        }
        return Number(order[0])
      })
    )

    private viewportSize$ = concat(
      of(null), // emit on init
      this.recalcViewportSize$,
    ).pipe(
      debounceTime(160),
      map(() => {
        const panel = document.getElementsByClassName('neuroglancer-panel') as HTMLCollectionOf<HTMLElement>
        if (!(panel?.[0])) {
          return null
        }
        return {
          width: panel[0].offsetWidth,
          height: panel[0].offsetHeight
        }
      }),
      shareReplay(1),
    )

    private navPosition$: Observable<{real: [number, number, number], voxel: [number, number, number]}> = this.nehubaViewer$.pipe(
      switchMap(viewer => {
        if (!viewer) return of(null)
        return combineLatest([
          viewer.viewerPosInReal$,
          viewer.viewerPosInVoxel$,
        ]).pipe(
          map(([ real, voxel ]) => {
            return { real, voxel }
          })
        )
      }),
      shareReplay(1)
    )

    private rangeControlSetting$ = this.maximisedPanelIndex$.pipe(
      map(maximisedPanelIndex => {
        let anatomicalOrientation: AnatomicalOrientation = null
        let rangeOrientation: RangeOrientation = null
        let minimapView: EnumClassicalView
        let sliceView: EnumClassicalView
        if (maximisedPanelIndex === 0) {
          anatomicalOrientation = 'ap'
          rangeOrientation = 'horizontal'
          minimapView = EnumClassicalView.SAGITTAL
          sliceView = EnumClassicalView.CORONAL
        }
        if (maximisedPanelIndex === 1) {
          anatomicalOrientation = 'rl'
          rangeOrientation = 'horizontal'
          minimapView = EnumClassicalView.CORONAL
          sliceView = EnumClassicalView.SAGITTAL
        }
        if (maximisedPanelIndex === 2) {
          anatomicalOrientation = 'si'
          rangeOrientation = 'vertical'
          minimapView = EnumClassicalView.CORONAL
          sliceView = EnumClassicalView.AXIAL
        }
        return {
          anatomicalOrientation,
          rangeOrientation,
          minimapView,
          sliceView
        }
      })
    )

    public rangeControlIsVertical$ = this.rangeControlSetting$.pipe(
      map(ctrl => ctrl?.rangeOrientation === "vertical")
    )

    private currentTemplateSize$ = this.tmplInfo$.pipe(
      filter(val => !!val)
    )

    private useMinimap$: Observable<EnumClassicalView> = this.maximisedPanelIndex$.pipe(
      map(maximisedPanelIndex => {
        if (maximisedPanelIndex === 0) return EnumClassicalView.SAGITTAL
        if (maximisedPanelIndex === 1) return EnumClassicalView.CORONAL
        if (maximisedPanelIndex === 2) return EnumClassicalView.CORONAL
        return null
      })
    )


    // this crazy hack is required since firefox support vertical-orient
    // do not and -webkit-slider-thumb#apperance cannot be used to hide the thumb
    public rangeInputStyle$ = this.rangeControlIsVertical$.pipe(
      withLatestFrom(this.currentTemplateSize$, this.useMinimap$),
      map(([ isVertical, templateSizes, useMinimap ]) => {
        if (!isVertical) return {}
        const { real } = templateSizes
        const [ width, height ] = getDim(real, useMinimap)
        const max = Math.max(width, height)
        const useHeight = width/max*MAX_DIM
        const useWidth = height/max*MAX_DIM

        const xformOriginVal = Math.min(useHeight, useWidth)/2
        const transformOrigin = `${xformOriginVal}px ${xformOriginVal}px`

        return {
          height: `${useHeight}px`,
          width: `${useWidth}px`,
          transformOrigin,
        }
      })
    )

    public rangeControlMinMaxValue$ = this.currentTemplateSize$.pipe(
      switchMap(templateSize => {
        return this.rangeControlSetting$.pipe(
          switchMap(orientation => this.navPosition$.pipe(
            take(1),
            map(nav => {
              if (!nav || !orientation || !templateSize) return null
              
              const { real: realPos } = nav

              const { anatomicalOrientation: anatOri } = orientation
              const idx = anatOriToIdx[anatOri]
              
              const { real, transform } = templateSize
              if (!transform || !transform[idx]) return null
              const min = Math.round(transform[idx][3])
              const max = Math.round(real[idx] + transform[idx][3])

              return {
                min, max, value: realPos[idx]
              }
            })
          ))
        )
      }),
    )
  
    public previewImageUrl$ = combineLatest([
      this.selectedTemplate$,
      this.useMinimap$,
      this.navPosition$,
    ]).pipe(
      map(([template, view, nav]) => {
        let useImgIdx = 0
        if (view === EnumClassicalView.SAGITTAL) {
          const { real } = nav || {}
          const xPos = real?.[0] || 0
          useImgIdx = xPos < 0 ? 0 : 1
        }
        const url = getScreenshotUrl(template, view, useImgIdx)
        if (!url) return null
        return `assets/images/persp-view/${url}`
      }),
      distinctUntilChanged()
    )

    public sliceviewIsNormal$ = this.store$.pipe(
      select(atlasSelection.selectors.navigation),
      map(navigation => {
        // if navigation in store is nullish, assume starting position, ie slice view is normal
        if (!navigation) return true
        return [0, 0, 0, 1].every((v, idx) => floatEquality(navigation.orientation[idx], v,  1e-3))})
    )

    public textToDisplay$ = combineLatest([
      this.sliceviewIsNormal$,
      this.navPosition$,
      this.maximisedPanelIndex$,
    ]).pipe(
      map(([ sliceviewIsNormal, nav, maximisedIdx ]) => {
        if (!sliceviewIsNormal) return null
        if (!(nav?.real) || (maximisedIdx === null)) return null
        return `${(nav.real[maximisedIdx === 0? 1 : maximisedIdx === 1? 0 : 2] / 1e6).toFixed(3)}mm`
      })
    )

    public scrubberPosition$ = this.rangeControlMinMaxValue$.pipe(
      switchMap(minmaxval => concat(
        of(null as number),
        this.minimapControl.valueChanges,
      ).pipe(
        map(newval => {
          if (!minmaxval) return null
          const { min, max, value } = minmaxval
          if (min === null || max === null) return null
          const useValue = newval ?? value
          if (useValue === null) return null
          const translate = 100 * (useValue - min) / (max - min)
          return `translateX(${translate}%)`
        })
      ))
    )

    public scrubberHighlighter$ = this.nehubaViewer$.pipe(
      switchMap(viewer => combineLatest([
        // on component init, the viewerPositionChange would not have fired
        // in this case. So we get the zoom from the store as the first value
        concat(
          this.store$.pipe(
            select(atlasSelection.selectors.navigation),
            take(1)
          ),
          viewer
            ? viewer.viewerPositionChange
            : NEVER,
        ),
        this.viewportSize$,
        this.rangeControlSetting$,
        this.currentTemplateSize$,
        this.rangeControlIsVertical$,
      ]).pipe(
        map(([ navigation, viewportSize, ctrl, templateSize, ..._rest ]) => {
          if (!ctrl || !(templateSize?.real) || !navigation) return null

          const { zoom, position } = navigation

          let translate: number = null
          const { sliceView } = ctrl

          const getTranslatePc = (idx: number) => {
            const trueCenter = templateSize.real[idx] / 2
            const compensate = trueCenter + templateSize.transform[idx][3]
            return (position[idx] - compensate) / templateSize.real[idx]
          }

          let scale: number = 2
          const sliceviewDim = getDim(templateSize.real, sliceView)
          if (!sliceviewDim) return null

          if (sliceView === EnumClassicalView.CORONAL) {
            // minimap is sagittal view, so interested in superior-inferior axis
            translate = getTranslatePc(2)
            scale = Math.min(scale, viewportSize.height * zoom / sliceviewDim[1])
          }

          if (sliceView === EnumClassicalView.SAGITTAL) {
            // minimap is coronal view, so interested in superior-inferior axis
            translate = getTranslatePc(2)
            scale = Math.min(scale, viewportSize.height * zoom / sliceviewDim[1])
          }

          if (sliceView === EnumClassicalView.AXIAL) {
            // minimap  is in coronal view, so interested in left-right axis
            translate = getTranslatePc(0) * -1
            scale = Math.min(scale, viewportSize.width * zoom / sliceviewDim[0])
          }

          /**
           * calculate scale
           */
          const scaleString = `scaleY(${scale})`

          /**
           * calculate translation
           */
          const translateString = `translateY(${translate * -100}%)`

          return `${translateString} ${scaleString}`
        })
      ))
    )

    constructor(
      private store$: Store,
      @Inject(NEHUBA_INSTANCE_INJTKN) private nehubaViewer$: Observable<NehubaViewerUnit>,
      @Inject(CURRENT_TEMPLATE_DIM_INFO) private tmplInfo$: Observable<TemplateInfo>,
    ) {

      const posMod$ = this.rangeControlSetting$.pipe(
        switchMap(rangeCtrl => this.#dragging.pipe(
          withLatestFrom(
            this.minimapControl.valueChanges,
            this.currentTemplateSize$,
            this.#xyRatio,
          ),
          map(([_, newValue, currTmplSize, xyRatio]) => {
            
            const positionMod: ModArr[] = []

            const { anatomicalOrientation } = rangeCtrl
            if (!isNullish(anatomicalOrientation) && !isNullish(newValue)) {
              const idx = anatOriToIdx[anatomicalOrientation]
              positionMod.push({
                idx,
                value: newValue
              })
              
            }

            if (!isNullish(xyRatio.x) && !isNullish(xyRatio.y)) {
              const { idx, value } = anaOriAltAxis[anatomicalOrientation](currTmplSize.real, xyRatio)
              positionMod.push({
                idx,
                value
              })
            }
            return { positionMod, zoom: null as number }
          })
        ))
      )

      const zoom$ = this.nehubaViewer$.pipe(
        switchMap(nehubaViewer => this.#zoom.pipe(
          withLatestFrom(nehubaViewer
          ? nehubaViewer.viewerPositionChange
          : NEVER),
          map(([zoom, posChange]) => {
            const { zoom: currZoom } = posChange
            return {
              zoom: zoom > 0 ? currZoom * 1.2 : currZoom * 0.8,
              positionMod: null as ModArr[]
            }
          })
        ))
      )

      this.nehubaViewer$.pipe(
        switchMap(nehubaViewer =>
          merge(
            posMod$,
            zoom$,
          ).pipe(
            map(({ positionMod, zoom }) => ({
              nehubaViewer, positionMod, zoom
            }))
          )
        ),
        withLatestFrom(
          this.navPosition$.pipe(
            map(value => value?.real)
          ),
        ),
        takeUntil(this.#destroy$)
      ).subscribe(([{ nehubaViewer, positionMod, zoom }, currentPosition]) => {

        const newNavPosition = [...currentPosition]
        if (!isNullish(positionMod)) {
          for (const { idx, value } of positionMod) {
            newNavPosition[idx] = value
          }
        }
        nehubaViewer.setNavigationState({
          position: newNavPosition,
          ...(isNullish(zoom) ? {} : { zoom }),
          positionReal: true
        })
      })

      combineLatest([
        this.sliceviewIsNormal$,
        this.navPosition$,
        this.maximisedPanelIndex$,
      ]).pipe(
        filter(([ sliceViewIsNormal ]) => sliceViewIsNormal),
        map(([ _, ...rest ]) => rest),
        takeUntil(this.#destroy$)
      ).subscribe(([ navPos, maximisedIdx]) => {
        const realPos = navPos?.real
        if (!realPos) {
          return
        }
        const pos = navPos.real[maximisedIdx === 0? 1 : maximisedIdx === 1? 0 : 2]
        const diff = Math.abs(this.minimapControl.value - pos)
        if (diff > 1e6) {
          this.minimapControl.setValue(pos)
        }
      })
    }


    resetSliceview() {
      this.store$.dispatch(
        atlasSelection.actions.navigateTo({
          animation: true,
          navigation: {
            orientation: [0, 0, 0, 1]
          }
        })
      )
    }
  
}

const spaceIdToPrefix = {
  "minds/core/referencespace/v1.0.0/dafcffc5-4826-4bf1-8ff6-46b8a31ff8e2": "mni152",
  "minds/core/referencespace/v1.0.0/7f39f7be-445b-47c0-9791-e971c0b6d992": "colin27",
  "minds/core/referencespace/v1.0.0/a1655b99-82f1-420f-a3c2-fe80fd4c8588": "bigbrain",
  "minds/core/referencespace/v1.0.0/MEBRAINS": "mebrains",
  "minds/core/referencespace/v1.0.0/265d32a0-3d84-40a5-926f-bf89f68212b9": "allen",
  "minds/core/referencespace/v1.0.0/d5717c4a-0fa1-46e6-918c-b8003069ade8": "waxholm"
}

const viewToSuffix = {
  [EnumClassicalView.SAGITTAL]: 'sagittal',
  [EnumClassicalView.AXIAL]: 'axial',
  [EnumClassicalView.CORONAL]: 'coronal',
}

function getScreenshotUrl(space: SxplrTemplate, requestedView: EnumClassicalView, imgIdx: number = 0): string {
  const prefix = spaceIdToPrefix[space?.id]
  if (!prefix) return null
  const suffix = viewToSuffix[requestedView]
  if (!suffix) return null
  return `${prefix}_${suffix}_${imgIdx}.png`
}
