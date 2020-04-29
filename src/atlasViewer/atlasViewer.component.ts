import {
  AfterViewInit,
  Component,
  HostBinding,
  OnDestroy,
  OnInit,
  Renderer2,
  TemplateRef,
  ViewChild,
  ElementRef,
  Inject,
  Optional,
} from "@angular/core";
import { ActionsSubject, select, Store } from "@ngrx/store";
import {combineLatest, interval, merge, Observable, of, Subscription} from "rxjs";
import {
  concatMap,
  delay,
  distinctUntilChanged,
  filter,
  map,
  withLatestFrom,
} from "rxjs/operators";
import { LayoutMainSide } from "../layouts/mainside/mainside.component";
import {
  IavRootStoreInterface,
  isDefined,
  safeFilter,
} from "../services/stateStore.service";
import { AtlasViewerConstantsServices, UNSUPPORTED_INTERVAL, UNSUPPORTED_PREVIEW } from "./atlasViewer.constantService.service";
import { WidgetServices } from "./widgetUnit/widgetService.service";

import { LocalFileService } from "src/services/localFile.service";
import { AGREE_COOKIE, AGREE_KG_TOS, SHOW_KG_TOS } from "src/services/state/uiState.store";
import {
  CLOSE_SIDE_PANEL,
  OPEN_SIDE_PANEL,
} from "src/services/state/uiState.store";
import { FixedMouseContextualContainerDirective } from "src/util/directives/FixedMouseContextualContainerDirective.directive";
import { getViewer, isSame } from "src/util/fn";
import { NehubaContainer } from "../ui/nehubaContainer/nehubaContainer.component";
import { colorAnimation } from "./atlasViewer.animation"
import { MouseHoverDirective } from "src/util/directives/mouseOver.directive";
import {MatSnackBar, MatSnackBarRef} from "@angular/material/snack-bar";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import { ARIA_LABELS } from 'common/constants'

export const NEHUBA_CLICK_OVERRIDE = 'NEHUBA_CLICK_OVERRIDE'

/**
 * TODO
 * check against auxlillary mesh indicies, to only filter out aux indicies
 */
const filterFn = (segment) => typeof segment.segment !== 'string'
const compareFn = (it, item) => it.name === item.name

@Component({
  selector: 'atlas-viewer',
  templateUrl: './atlasViewer.template.html',
  styleUrls: [
    `./atlasViewer.style.css`,
  ],
  animations : [
    colorAnimation,
  ],
})

export class AtlasViewer implements OnDestroy, OnInit, AfterViewInit {

  public CONTEXT_MENU_ARIA_LABEL = ARIA_LABELS.CONTEXT_MENU
  public compareFn = compareFn

  @ViewChild('cookieAgreementComponent', {read: TemplateRef}) public cookieAgreementComponent: TemplateRef<any>

  @ViewChild('kgToS', {read: TemplateRef}) public kgTosComponent: TemplateRef<any>
  @ViewChild(LayoutMainSide) public layoutMainSide: LayoutMainSide

  @ViewChild(NehubaContainer) public nehubaContainer: NehubaContainer

  @ViewChild(FixedMouseContextualContainerDirective) public rClContextualMenu: FixedMouseContextualContainerDirective
  @ViewChild(MouseHoverDirective) private mouseOverNehuba: MouseHoverDirective

  /**
   * required for styling of all child components
   */
  @HostBinding('attr.darktheme')
  public darktheme: boolean = false

  @HostBinding('attr.ismobile')
  public ismobile: boolean = false
  public meetsRequirement: boolean = true

  public sidePanelView$: Observable<string|null>
  private newViewer$: Observable<any>

  public selectedRegions$: Observable<any[]>
  public selectedPOI$: Observable<any[]>

  private snackbarRef: MatSnackBarRef<any>
  public snackbarMessage$: Observable<string>

  public dedicatedView$: Observable<string | null>
  public onhoverSegments$: Observable<string[]>

  public onhoverLandmark$: Observable<{landmarkName: string, datasets: any} | null>
  public onhoverLandmarkForFixed$: Observable<any>

  private subscriptions: Subscription[] = []

  /* handlers for nglayer */
  /**
   * TODO make untangle nglayernames and its dependency on ng
   * TODO deprecated
   */
  public ngLayerNames$: Observable<any>
  public ngLayers: INgLayerInterface[]
  private disposeHandler: any

  public unsupportedPreviewIdx: number = 0
  public unsupportedPreviews: any[] = UNSUPPORTED_PREVIEW

  public sidePanelIsOpen$: Observable<boolean>

  public onhoverSegmentsForFixed$: Observable<string[]>

  constructor(
    private store: Store<IavRootStoreInterface>,
    private widgetServices: WidgetServices,
    private constantsService: AtlasViewerConstantsServices,
    private matDialog: MatDialog,
    private dispatcher$: ActionsSubject,
    private rd: Renderer2,
    public localFileService: LocalFileService,
    private snackbar: MatSnackBar,
    private el: ElementRef,
    @Optional() @Inject(NEHUBA_CLICK_OVERRIDE) private nehubaClickOverride: Function
  ) {

    this.snackbarMessage$ = this.store.pipe(
      select('uiState'),
      select("snackbarMessage"),
    )

    /**
     * TODO deprecated
     */
    this.ngLayerNames$ = this.store.pipe(
      select('viewerState'),
      filter(state => isDefined(state) && isDefined(state.templateSelected)),
      distinctUntilChanged((o, n) => o.templateSelected.name === n.templateSelected.name),
      map(state => Object.keys(state.templateSelected.nehubaConfig.dataset.initialNgState.layers)),
      delay(0),
    )

    this.sidePanelView$ = this.store.pipe(
      select('uiState'),
      filter(state => isDefined(state)),
      map(state => state.focusedSidePanel),
    )

    this.sidePanelIsOpen$ = this.store.pipe(
      select('uiState'),
      select('sidePanelIsOpen')
    )

    this.selectedRegions$ = this.store.pipe(
      select('viewerState'),
      filter(state => isDefined(state) && isDefined(state.regionsSelected)),
      map(state => state.regionsSelected),
      distinctUntilChanged(),
    )

    this.selectedPOI$ = combineLatest(
      this.selectedRegions$,
      this.store.pipe(
        select('viewerState'),
        filter(state => isDefined(state) && isDefined(state.landmarksSelected)),
        map(state => state.landmarksSelected),
        distinctUntilChanged(),
      ),
    ).pipe(
      map(results => [...results[0], ...results[1]]),
    )

    this.newViewer$ = this.store.pipe(
      select('viewerState'),
      select('templateSelected'),
      distinctUntilChanged(isSame),
    )

    // TODO deprecate
    this.dedicatedView$ = this.store.pipe(
      select('viewerState'),
      filter(state => isDefined(state) && typeof state.dedicatedView !== 'undefined'),
      map(state => state.dedicatedView),
      distinctUntilChanged(),
    )

    // TODO temporary hack. even though the front octant is hidden, it seems if a mesh is present, hover will select the said mesh
    this.onhoverSegments$ = this.store.pipe(
      select('uiState'),
      select('mouseOverSegments'),
      filter(v => !!v),
      distinctUntilChanged((o, n) => o.length === n.length && n.every(segment => o.find(oSegment => oSegment.layer.name === segment.layer.name && oSegment.segment === segment.segment) ) ),
      /* cannot filter by state, as the template expects a default value, or it will throw ExpressionChangedAfterItHasBeenCheckedError */

    ).pipe(
      withLatestFrom(
        this.onhoverLandmark$ || of(null)
      ),
      map(([segments, onhoverLandmark]) => onhoverLandmark ? null : segments ),
      map(segments => {
        if (!segments) { return null }
        const filteredSeg = segments.filter(filterFn)
        return filteredSeg.length > 0
          ? segments.map(s => s.segment)
          : null
      }),
    )

    this.selectedParcellation$ = this.store.pipe(
      select('viewerState'),
      safeFilter('parcellationSelected'),
      map(state => state.parcellationSelected),
      distinctUntilChanged(),
    )

    this.subscriptions.push(
      this.selectedParcellation$.subscribe(parcellation => {
        this.selectedParcellation = parcellation
      }),

    )

    const error = this.el.nativeElement.getAttribute('data-error')

    if (error) {
      this.snackbar.open(error, 'Dismiss', { duration: 5000 })
      this.el.nativeElement.removeAttribute('data-error')
    }
  }

  private selectedParcellation$: Observable<any>
  private selectedParcellation: any

  private cookieDialogRef: MatDialogRef<any>
  private kgTosDialogRef: MatDialogRef<any>

  public ngOnInit() {
    this.meetsRequirement = this.meetsRequirements()

    if (!this.meetsRequirement) {
      merge(
        of(-1),
        interval(UNSUPPORTED_INTERVAL),
      ).pipe(
        map(v => {
          let idx = v
          while (idx < 0) {
            idx = v + this.unsupportedPreviews.length
          }
          return idx % this.unsupportedPreviews.length
        }),
      ).subscribe(val => {
        this.unsupportedPreviewIdx = val
      })
    }

    this.subscriptions.push(
      this.constantsService.useMobileUI$.subscribe(bool => this.ismobile = bool),
    )

    this.subscriptions.push(
      this.snackbarMessage$.pipe(
        // angular material issue
        // see https://github.com/angular/angular/issues/15634
        // and https://github.com/angular/components/issues/11357
        delay(0),
      ).subscribe(messageSymbol => {
        if (this.snackbarRef) { this.snackbarRef.dismiss() }

        if (!messageSymbol) { return }

        // https://stackoverflow.com/a/48191056/6059235
        const message = messageSymbol.toString().slice(7, -1)
        this.snackbarRef = this.snackbar.open(message, 'Dismiss', {
          duration: 5000,
        })
      }),
    )

    /**
     * TODO deprecated
     * TODO what the??? is this?
     */
    this.subscriptions.push(
      this.ngLayerNames$.pipe(
        concatMap(data => this.constantsService.loadExportNehubaPromise.then(data)),
      ).subscribe(() => {
        this.ngLayersChangeHandler()
        const viewer = getViewer()
        this.disposeHandler = viewer.layerManager.layersChanged.add(() => this.ngLayersChangeHandler())
        viewer.registerDisposer(this.disposeHandler)
      }),
    )

    this.subscriptions.push(
      this.newViewer$.subscribe(() => {
        this.widgetServices.clearAllWidgets()
      }),
    )

    this.subscriptions.push(
      this.sidePanelView$.pipe(
        filter(() => typeof this.layoutMainSide !== 'undefined'),
      ).subscribe(v => this.layoutMainSide.showSide =  isDefined(v)),
    )

    this.subscriptions.push(
      this.constantsService.darktheme$.subscribe(flag => {
        this.rd.setAttribute(document.body, 'darktheme', flag.toString())
      }),
    )
  }

  public ngAfterViewInit() {
    /**
     * preload the main bundle after atlas viewer has been loaded.
     * This should speed up where user first navigate to the home page,
     * and the main.bundle should be downloading after atlasviewer has been rendered
     */
    if (this.meetsRequirement) {
      const prefecthMainBundle = this.rd.createElement('link')
      prefecthMainBundle.rel = 'preload'
      prefecthMainBundle.as = 'script'
      prefecthMainBundle.href = 'main.bundle.js'
      this.rd.appendChild(document.head, prefecthMainBundle)
    }

    this.onhoverLandmark$ = this.mouseOverNehuba.currentOnHoverObs$.pipe(
      select('landmark')
    )

    /**
     * Show Cookie disclaimer if not yet agreed
     */
    /**
     * TODO avoid creating new views in lifecycle hooks in general
     */
    this.store.pipe(
      select('uiState'),
      select('agreedCookies'),
      filter(agreed => !agreed),
      delay(0),
    ).subscribe(() => {
      this.cookieDialogRef = this.matDialog.open(this.cookieAgreementComponent)
    })

    this.dispatcher$.pipe(
      filter(({type}) => type === SHOW_KG_TOS),
      withLatestFrom(this.store.pipe(
        select('uiState'),
        select('agreedKgTos'),
      )),
      map(([_, agreed]) => agreed),
      filter(flag => !flag),
      delay(0),
    ).subscribe(() => {
      this.kgTosDialogRef = this.matDialog.open(this.kgTosComponent)
    })

    this.onhoverSegmentsForFixed$ = this.rClContextualMenu.onShow.pipe(
      withLatestFrom(this.onhoverSegments$),
      map(([_flag, onhoverSegments]) => onhoverSegments || []),
    )

    this.onhoverLandmarkForFixed$ = this.rClContextualMenu.onShow.pipe(
      withLatestFrom(
        this.onhoverLandmark$ || of(null)
      ),
      map(([_flag, onhoverLandmark]) => onhoverLandmark)
    )
  }

  public mouseClickDocument(event: MouseEvent) {

    const dismissRClCtxtMenu = this.rClContextualMenu.isShown

    const next = () => {

      if (!this.rClContextualMenu) { return }

      if (dismissRClCtxtMenu) {
        if (!this.rClContextualMenu.el.nativeElement.contains(event.target)) {
          this.rClContextualMenu.hide()
        }
      } else {
        this.rClContextualMenu.mousePos = [
          event.clientX,
          event.clientY,
        ]
        this.rClContextualMenu.show()
      } 
    }

    this.nehubaClickOverride(next)

  }

  public toggleSideNavMenu(opened) {
    this.store.dispatch({type: opened ? CLOSE_SIDE_PANEL : OPEN_SIDE_PANEL})
  }

  /**
   * For completeness sake. Root element should never be destroyed.
   */
  public ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe())
  }

  /**
   * perhaps move this to constructor?
   */
  public meetsRequirements(): boolean {

    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') as WebGLRenderingContext

    if (!gl) {
      return false
    }

    const colorBufferFloat = gl.getExtension('EXT_color_buffer_float')

    if (!colorBufferFloat) {
      return false
    }

    return true
  }

  /**
   * TODO deprecated
   */
  public ngLayersChangeHandler() {
    const viewer = getViewer()
    this.ngLayers = (viewer.layerManager.managedLayers as any[])
      // .filter(obj => obj.sourceUrl && /precomputed|nifti/.test(obj.sourceUrl))
      .map(obj => ({
        name : obj.name,
        type : obj.initialSpecification.type,
        source : obj.sourceUrl,
        visible : obj.visible,
      }) as INgLayerInterface)
  }

  public kgTosClickedOk() {
    if (this.kgTosDialogRef) { this.kgTosDialogRef.close() }
    this.store.dispatch({
      type: AGREE_KG_TOS,
    })
  }

  public cookieClickedOk() {
    if (this.cookieDialogRef) { this.cookieDialogRef.close() }
    this.store.dispatch({
      type: AGREE_COOKIE,
    })
  }

  @HostBinding('attr.version')
  public _version: string = VERSION
}

export interface INgLayerInterface {
  name: string
  visible: boolean
  source: string
  type: string // image | segmentation | etc ...
  transform?: [[number, number, number, number], [number, number, number, number], [number, number, number, number], [number, number, number, number]] | null
  // colormap : string
}
