import {
  Component,
  TemplateRef,
  HostBinding,
  Inject,
  inject,
} from "@angular/core";
import { select, Store } from "@ngrx/store";
import { LoggingService } from "src/logging";
import { NehubaViewerUnit } from "../nehubaViewer/nehubaViewer.component";
import { Observable, Subject, concat, of } from "rxjs";
import { map, filter, takeUntil, switchMap, shareReplay, debounceTime, scan } from "rxjs/operators";
import { Clipboard, MatBottomSheet, MatSnackBar } from "src/sharedModules/angularMaterial.exports"
import { ARIA_LABELS, QUICKTOUR_DESC } from 'common/constants'
import { FormControl, FormGroup } from "@angular/forms";

import { NEHUBA_INSTANCE_INJTKN } from '../util'
import { IQuickTourData } from "src/ui/quickTour/constrants";
import { actions } from "src/state/atlasSelection";
import { atlasSelection } from "src/state";
import { SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes";
import { NEHUBA_CONFIG_SERVICE_TOKEN, NehubaConfigSvc } from "../config.service";
import { DestroyDirective } from "src/util/directives/destroy.directive";
import { getUuid } from "src/util/fn";
import { Render, TAffine, isAffine } from "src/components/coordTextBox"

type TSpace = {
  label: string
  affine: TAffine
}

@Component({
  selector : 'iav-cmp-viewer-nehuba-status',
  templateUrl : './statusCard.template.html',
  styleUrls : ['./statusCard.style.css'],
  hostDirectives: [
    DestroyDirective,
  ],
})
export class StatusCardComponent {

  #newSpace = new Subject<TSpace>()
  additionalSpace$ = this.#newSpace.pipe(
    scan((acc, v) => acc.concat(v), [] as TSpace[])
  )
  readonly idAffStr = `[
  [1, 0, 0, 0],
  [0, 1, 0, 0],
  [0, 0, 1, 0],
  [0, 0, 0, 1]
]
`
  readonly defaultLabel = `New Space`
  reset(label: HTMLInputElement, affine: HTMLTextAreaElement){
    label.value = this.defaultLabel
    affine.value = this.idAffStr
  }
  add(label: HTMLInputElement, affine: HTMLTextAreaElement) {
    try {
      const aff = JSON.parse(affine.value)
      if (!isAffine(aff)) {
        throw new Error(`${affine.value} cannot be parsed into 4x4 affine`)
      }
      this.#newSpace.next({
        label: label.value,
        affine: aff
      })
    } catch (e) {
      console.error(`Error: ${e.toString()}`)
    }
    
  }

  readonly renderMm: Render = v => v.map(i => `${i}mm`).join(", ")
  readonly renderDefault: Render = v => v.map(i => i.toFixed(3)).join(", ")

  readonly #destroy$ = inject(DestroyDirective).destroyed$

  public nehubaViewer: NehubaViewerUnit

  @HostBinding('attr.aria-label')
  public arialabel = ARIA_LABELS.STATUS_PANEL
  public showFull = false

  public dialogForm = new FormGroup({
    x: new FormControl<string>(null),
    y: new FormControl<string>(null),
    z: new FormControl<string>(null),
  })

  #pasted$ = new Subject<string>()
  #coordEditDialogClosed = new Subject()

  private selectedTemplate: SxplrTemplate
  private currentNavigation: {
    position: number[]
    orientation: number[]
    zoom: number
    perspectiveOrientation: number[]
    perspectiveZoom: number
  }

  readonly navigation$ = this.nehubaViewer$.pipe(
    filter(v => !!v),
    switchMap(nv => nv.viewerPosInReal$.pipe(
      map(vals => (vals || [0, 0, 0]).map(v => Number((v / 1e6).toFixed(3))))
    )),
    shareReplay(1),
  )

  readonly navVal$ = this.navigation$.pipe(
    map(v => v.map(v => `${v}mm`).join(", "))
  )
  readonly mouseVal$ = this.nehubaViewer$.pipe(
    filter(v => !!v),
    switchMap(nehubaViewer => 
      nehubaViewer.mousePosInReal$.pipe(
        filter(v => !!v),
        map(real => real.map(v => Number((v/1e6).toFixed(3))))
      ),
    )
  )

  public readonly dialogInputState$ = this.dialogForm.valueChanges.pipe(
    map(({ x, y, z }) => {
      const allEntries = [x, y, z].map(v => this.#parseString(v))
      return {
        validated: allEntries.every(entry =>
          (
            entry.length === 1
            && !Number.isNaN(entry[0])
          )
        ),
        valueMm: allEntries.map(entry => entry[0]),
        valueNm: allEntries.map(entry => entry[0]).map(v => v*1e6),
        string: allEntries.map(entry => `${entry[0]}mm`).join(", "),
      }
    }),
    shareReplay(1)
  )

  public quickTourData: IQuickTourData = {
    description: QUICKTOUR_DESC.STATUS_CARD,
    order: 6,
  }

  public SHARE_BTN_ARIA_LABEL = ARIA_LABELS.SHARE_BTN
  public SHOW_FULL_STATUS_PANEL_ARIA_LABEL = ARIA_LABELS.SHOW_FULL_STATUS_PANEL
  public HIDE_FULL_STATUS_PANEL_ARIA_LABEL = ARIA_LABELS.HIDE_FULL_STATUS_PANEL
  public COPY_NAVIGATION_STRING = "Copy navigation coordinates to clipboard"
  constructor(
    private store$: Store<any>,
    private log: LoggingService,
    private bottomSheet: MatBottomSheet,
    private clipboard: Clipboard,
    private snackbar: MatSnackBar,
    @Inject(NEHUBA_CONFIG_SERVICE_TOKEN) private nehubaConfigSvc: NehubaConfigSvc,
    @Inject(NEHUBA_INSTANCE_INJTKN) private nehubaViewer$: Observable<NehubaViewerUnit>,
  ) {
    nehubaViewer$.pipe(
      takeUntil(this.#destroy$)
    ).subscribe(
      viewer => this.nehubaViewer = viewer
    )
    this.store$.pipe(
      select(atlasSelection.selectors.navigation)
    ).pipe(
      takeUntil(this.#destroy$)
    ).subscribe(nav => this.currentNavigation = nav)

    this.nehubaViewer$.pipe(
      filter(nv => !!nv),
      switchMap(nv => concat(
        of(null),
        this.#coordEditDialogClosed,
      ).pipe(
        switchMap(() => nv.viewerPosInReal$.pipe(
          filter(pos => !!pos),
          debounceTime(120),
          shareReplay(1)
        ))
      )),
      takeUntil(this.#destroy$)
    ).subscribe(val => {
      const [x, y, z] = val.map(v => (v/1e6).toFixed(3))
      this.dialogForm.setValue({ x, y, z })
    })

    this.store$.pipe(
      select(atlasSelection.selectors.selectedTemplate)
    ).pipe(
      takeUntil(this.#destroy$)
    ).subscribe(n => this.selectedTemplate = n)

    this.dialogInputState$.pipe(
      takeUntil(this.#destroy$)
    ).subscribe()

    this.#pasted$.pipe(
      filter(v => !!v), // '' is falsy, so filters out null, undefined, '' etc
      map(v => this.#parseString(v)),
      filter(fullEntry => !!fullEntry && fullEntry.every(entry => !Number.isNaN(entry))),
      takeUntil(this.#destroy$),
      debounceTime(0),
      // need to update value on the separate frame to paste action
      // otherwise, dialogForm.setValue will have no effect
    ).subscribe(fullEntry => {
      this.dialogForm.setValue({
        x: `${fullEntry[0]}`,
        y: `${fullEntry[1]}`,
        z: `${fullEntry[2]}`,
      })
    })
  }

  #parseString(input: string): number[]{
    return input
      .split(/[\s|,]+/)
      .map(v => {
        if (/mm$/.test(v)) {
          return v.replace(/mm$/, "")
        }
        return v
      })
      .map(Number)
  }

  public textNavigateTo(string: string): void {
    if (string.split(/[\s|,]+/).length >= 3 && string.split(/[\s|,]+/).slice(0, 3).every(entry => !isNaN(Number(entry.replace(/mm/, ''))))) {
      const pos = (string.split(/[\s|,]+/).slice(0, 3).map((entry) => Number(entry.replace(/mm/, '')) * 1000000))
      this.nehubaViewer.setNavigationState({
        position : (pos as [number, number, number]),
        positionReal : true,
      })
    } else {
      this.log.log('input did not parse to coordinates ', string)
    }
  }

  public selectPoint(posNm: number[]) {
    this.store$.dispatch(
      atlasSelection.actions.selectPoint({
        point: {
          "@type": "https://openminds.ebrains.eu/sands/CoordinatePoint",
          "@id": getUuid(),
          coordinateSpace: {
            "@id": this.selectedTemplate.id
          },
          coordinates: posNm.map(v => ({
            "@id": getUuid(),
            "@type": "https://openminds.ebrains.eu/core/QuantitativeValue",
            unit: {
              "@id": "id.link/mm"
            },
            value: v,
            uncertainty: [0, 0]
          }))
        }
      })
    )
    this.store$.dispatch(
      atlasSelection.actions.navigateTo({
        navigation: {
          position: posNm
        },
        physical: true,
        animation: true
      })
    )
  }

  showBottomSheet(tmpl: TemplateRef<any>): void{
    this.bottomSheet.open(tmpl)
  }

  /**
   * TODO
   * maybe have a nehuba manager service
   * so that reset navigation logic can stay there
   *
   * When that happens, we don't even need selectTemplate input
   *
   * the info re: nehubaViewer can stay there, too
   */
  public resetNavigation({rotation: rotationFlag = false, position: positionFlag = false, zoom : zoomFlag = false}: {rotation?: boolean, position?: boolean, zoom?: boolean}): void {
    const config = this.nehubaConfigSvc.getNehubaConfig(this.selectedTemplate)

    const {
      zoomFactor: zoom
    } = config.dataset.initialNgState.navigation

    this.store$.dispatch(
      actions.navigateTo({
        navigation: {
          ...this.currentNavigation,
          ...(rotationFlag ? { orientation: [0, 0, 0, 1] } : {}),
          ...(positionFlag ? { position: [0, 0, 0] } : {}),
          ...(zoomFlag ? { zoom: zoom } : {}),
        },
        physical: true,
        animation: true
      })
    )
  }

  copyString(value: string){
    this.clipboard.copy(value)
    this.snackbar.open(`Copied to clipboard!`, null, {
      duration: 1000
    })
  }

  onPaste(ev: ClipboardEvent) {
    const text = ev.clipboardData.getData('text/plain')
    this.#pasted$.next(text)
  }

  onCoordEditDialogClose(){
    this.#coordEditDialogClosed.next(null)
  }
}
