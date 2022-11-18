import { Component, OnDestroy, Inject, ViewChild, ChangeDetectionStrategy, HostBinding } from "@angular/core";
import { FormControl } from "@angular/forms";
import { select, Store } from "@ngrx/store";
import { combineLatest, concat, NEVER, Observable, of, Subject, Subscription } from "rxjs";
import { switchMap, distinctUntilChanged, map, debounceTime, shareReplay, take, withLatestFrom } from "rxjs/operators";
import { SAPI, SapiSpaceModel } from "src/atlasComponents/sapi";
import { fromRootStore } from "src/state/atlasSelection";
import { selectedTemplate } from "src/state/atlasSelection/selectors";
import { panelMode, panelOrder } from "src/state/userInterface/selectors";
import { ResizeObserverDirective } from "src/util/windowResize";
import { NehubaViewerUnit } from "../../nehubaViewer/nehubaViewer.component";
import { EnumPanelMode } from "../../store/store";
import { NEHUBA_INSTANCE_INJTKN } from "../../util";
import { EnumClassicalView } from "src/atlasComponents/constants"
import { atlasSelection } from "src/state";

const MINIMAP_SIZE = {
  width: 200,
  height: 200,
}
type AnatomicalOrientation = 'ap' | 'si' | 'lr' // anterior-posterior, superior-inferior, left-right
type RangeOrientation = 'horizontal' | 'vertical'
const anatOriToIdx: Record<AnatomicalOrientation, number> = {
  'lr': 0,
  'ap': 1,
  'si': 2
}

@Component({
  selector: 'nehuba-perspective-view-slider',
  templateUrl: './perspectiveViewSlider.template.html',
  styleUrls: ['./perspectiveViewSlider.style.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class PerspectiveViewSlider implements OnDestroy {

    @ViewChild(ResizeObserverDirective)
    resizeDirective: ResizeObserverDirective

    public minimapControl = new FormControl()
    public recalcViewportSize$ = new Subject()

    private selectedTemplate$ = this.store$.pipe(
      select(selectedTemplate),
      distinctUntilChanged((o, n) => o?.["@id"] === n?.["@id"]),
    )
    private subscriptions: Subscription[] = []
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
          anatomicalOrientation = 'lr'
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

    private currentTemplateSize$ = this.store$.pipe(
      fromRootStore.distinctATP(),
      switchMap(({ atlas, template }) => 
      atlas && template
      ? this.sapi.getSpace(atlas['@id'], template['@id']).getTemplateSize()
      : NEVER),
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
              let idx = null
              if (anatOri === "ap") idx = 1
              if (anatOri === "lr") idx = 0
              if (anatOri === "si") idx = 2
              if (idx === null) return null
              
              const { real, transform } = templateSize
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
      this.maximisedPanelIndex$.pipe(
        map(maximisedPanelIndex => {
          if (maximisedPanelIndex === 0) return EnumClassicalView.SAGITTAL
          if (maximisedPanelIndex === 1) return EnumClassicalView.CORONAL
          if (maximisedPanelIndex === 2) return EnumClassicalView.CORONAL
          return null
        })
      ),
    ]).pipe(
      map(([template, view]) => {
        const url = getScreenshotUrl(template, view)
        if (!url) return null
        return `assets/images/persp-view/${url}`
      })
    )

    public textToDisplay$ = combineLatest([
      this.navPosition$,
      this.maximisedPanelIndex$,
    ]).pipe(
      map(([ nav, maximisedIdx ]) => {
        if (!(nav?.real) || (maximisedIdx === null)) return null
        return `${(nav.real[maximisedIdx === 0? 1 : maximisedIdx === 1? 0 : 2] / 1e6).toFixed(3)}mm`
      })
    )

    public scrubberPosition$ = this.rangeControlMinMaxValue$.pipe(
      switchMap(minmaxval => concat(
        of(null),
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
        map(([ navigation, viewportSize, ctrl, templateSize, isVertical ]) => {
          if (!ctrl || !(templateSize?.real) || !navigation) return null

          const { zoom, position } = navigation

          let sliceviewDim: [number, number] = null
          let translate: number = null
          const { sliceView } = ctrl

          const getTranslatePc = (idx: number) => position[idx] / templateSize.real[idx]

          if (sliceView === EnumClassicalView.CORONAL) {
            sliceviewDim = [
              templateSize.real[0],
              templateSize.real[2]
            ]
            // minimap is saggital view, so interested in superior-inferior axis
            translate = getTranslatePc(2)
          }

          if (sliceView === EnumClassicalView.SAGITTAL) {
            sliceviewDim = [
              templateSize.real[1],
              templateSize.real[2]
            ]
            // minimap is coronal view, so interested in superior-inferior axis
            translate = getTranslatePc(2)
          }

          if (sliceView === EnumClassicalView.AXIAL) {
            sliceviewDim = [
              templateSize.real[0],
              templateSize.real[1]
            ]
            // minimap  is in coronal view, so interested in left-right axis
            translate = getTranslatePc(0) * -1
          }

          if (!sliceviewDim) return null
          

          /**
           * calculate scale
           */
          const scale = [2, 2]
          scale[0] = Math.min(scale[0], viewportSize.width * zoom / sliceviewDim[0])
          scale[1] = Math.min(scale[1], viewportSize.width * zoom / sliceviewDim[1])
          const scaleArr = scale.map(v => `scaleY(${v})`)
          const scaleString = isVertical ? scaleArr[1] : scaleArr[0]

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
      private sapi: SAPI,
      @Inject(NEHUBA_INSTANCE_INJTKN) private nehubaViewer$: Observable<NehubaViewerUnit>,
    ) {

      this.subscriptions.push(
        combineLatest([
          this.nehubaViewer$,
          this.rangeControlSetting$,
        ]).pipe(
          switchMap(([ nehubaViewer, rangeCtrl ]) => this.minimapControl.valueChanges.pipe(
            withLatestFrom(this.navPosition$.pipe(
              map(value => value?.real)
            )),
            map(([newValue, currentPosition]) => ({ nehubaViewer, rangeCtrl, newValue, currentPosition }))
          ))
        ).subscribe(({ nehubaViewer, rangeCtrl, newValue, currentPosition }) => {
          if (newValue === null) return
          const { anatomicalOrientation } = rangeCtrl
          if (!anatomicalOrientation) return
          const idx = anatOriToIdx[anatomicalOrientation]
          const newNavPosition = [...currentPosition]
          newNavPosition[idx] = newValue
          nehubaViewer.setNavigationState({
            position: newNavPosition,
            positionReal: true
          })
        }),
      )
    }

    ngOnDestroy(): void {
      this.subscriptions.forEach(s => s.unsubscribe());
    }
  
}

const spaceIdToPrefix = {
  "minds/core/referencespace/v1.0.0/dafcffc5-4826-4bf1-8ff6-46b8a31ff8e2": "icbm152",
  "minds/core/referencespace/v1.0.0/7f39f7be-445b-47c0-9791-e971c0b6d992": "colin",
  "minds/core/referencespace/v1.0.0/a1655b99-82f1-420f-a3c2-fe80fd4c8588": "bigbrain",
  "minds/core/referencespace/v1.0.0/MEBRAINS": "monkey",
  "minds/core/referencespace/v1.0.0/265d32a0-3d84-40a5-926f-bf89f68212b9": "mouse",
  "minds/core/referencespace/v1.0.0/d5717c4a-0fa1-46e6-918c-b8003069ade8": "rat"
}

const viewToSuffix = {
  [EnumClassicalView.SAGITTAL]: 'sag',
  [EnumClassicalView.AXIAL]: 'axial',
  [EnumClassicalView.CORONAL]: 'coronal',
}

function getScreenshotUrl(space: SapiSpaceModel, requestedView: EnumClassicalView): string {
  const prefix = spaceIdToPrefix[space?.['@id']]
  if (!prefix) return null
  const suffix = viewToSuffix[requestedView]
  if (!suffix) return null
  return `${prefix}-${suffix}.png`
}
