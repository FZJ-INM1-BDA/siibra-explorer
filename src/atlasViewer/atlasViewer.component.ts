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
  InjectionToken,
} from "@angular/core";
import { Store, select, ActionsSubject } from "@ngrx/store";
import { Observable, Subscription, combineLatest, interval, merge, of, timer, fromEvent } from "rxjs";
import { map, filter, distinctUntilChanged, delay, withLatestFrom, switchMapTo, take, startWith } from "rxjs/operators";

import { LayoutMainSide } from "../layouts/mainside/mainside.component";
import {
  IavRootStoreInterface,
  isDefined,
  safeFilter,
} from "../services/stateStore.service";
import { AtlasViewerConstantsServices, UNSUPPORTED_INTERVAL, UNSUPPORTED_PREVIEW } from "./atlasViewer.constantService.service";
import { WidgetServices } from "src/widget";

import { LocalFileService } from "src/services/localFile.service";
import { AGREE_COOKIE, AGREE_KG_TOS, SHOW_KG_TOS } from "src/services/state/uiState.store";
import { isSame } from "src/util/fn";
import { NehubaContainer } from "../ui/nehubaContainer/nehubaContainer.component";
import { colorAnimation } from "./atlasViewer.animation"
import { MouseHoverDirective } from "src/atlasViewer/mouseOver.directive";
import {MatSnackBar, MatSnackBarRef} from "@angular/material/snack-bar";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import { ARIA_LABELS, CONST } from 'common/constants'

import { MIN_REQ_EXPLAINER } from 'src/util/constants'
import { SlServiceService } from "src/spotlight/sl-service.service";
import { PureContantService } from "src/util";
import { viewerStateSetSelectedRegions, viewerStateRemoveAdditionalLayer, viewerStateHelperSelectParcellationWithId } from "src/services/state/viewerState.store.helper";
import { viewerStateGetOverlayingAdditionalParcellations, viewerStateParcVersionSelector, viewerStateStandAloneVolumes } from "src/services/state/viewerState/selectors";
import { ngViewerSelectorClearViewEntries } from "src/services/state/ngViewerState/selectors";
import { ngViewerActionClearView } from "src/services/state/ngViewerState/actions";
import { uiStateMouseOverSegmentsSelector } from "src/services/state/uiState/selectors";
import { ClickInterceptorService } from "src/glue";
import {SET_OVERRITEN_COLOR_MAP} from "src/services/state/viewerState.store";

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

  public CONST = CONST
  public CONTEXT_MENU_ARIA_LABEL = ARIA_LABELS.CONTEXT_MENU
  public compareFn = compareFn

  @ViewChild('cookieAgreementComponent', {read: TemplateRef}) public cookieAgreementComponent: TemplateRef<any>

  @ViewChild('kgToS', {read: TemplateRef}) public kgTosComponent: TemplateRef<any>
  @ViewChild(LayoutMainSide) public layoutMainSide: LayoutMainSide

  @ViewChild(NehubaContainer) public nehubaContainer: NehubaContainer

  @ViewChild(MouseHoverDirective) private mouseOverNehuba: MouseHoverDirective

  @ViewChild('idleOverlay', {read: TemplateRef}) idelTmpl: TemplateRef<any>

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
  public onhoverSegments: any[]
  public onhoverSegments$: Observable<any[]>

  public onhoverLandmark$: Observable<{landmarkName: string, datasets: any} | null>

  public overwrittenColorMap$: Observable<any>

  private subscriptions: Subscription[] = []

  public unsupportedPreviewIdx: number = 0
  public unsupportedPreviews: any[] = UNSUPPORTED_PREVIEW

  public MIN_REQ_EXPLAINER = MIN_REQ_EXPLAINER

  public isStandaloneVolumes$ = this.store.pipe(
    select(viewerStateStandAloneVolumes),
    map(v => v.length > 0)
  )

  public selectedAdditionalLayers$ = this.store.pipe(
    select(viewerStateGetOverlayingAdditionalParcellations),
  )

  public selectedLayerVersions$ = this.store.pipe(
    select(viewerStateParcVersionSelector),
    map(arr => arr.map(item => {
      const overwrittenName = item['@version'] && item['@version']['name']
      return overwrittenName
        ? { ...item, displayName: overwrittenName }
        : item
    }))
  )

  private selectedParcellation$: Observable<any>
  public selectedParcellation: any

  private cookieDialogRef: MatDialogRef<any>
  private kgTosDialogRef: MatDialogRef<any>

  public clearViewKeys$ = this.store.pipe(
    select(ngViewerSelectorClearViewEntries)
  )

  constructor(
    private store: Store<IavRootStoreInterface>,
    private widgetServices: WidgetServices,
    private constantsService: AtlasViewerConstantsServices,
    private pureConstantService: PureContantService,
    private matDialog: MatDialog,
    private dispatcher$: ActionsSubject,
    private rd: Renderer2,
    public localFileService: LocalFileService,
    private snackbar: MatSnackBar,
    private el: ElementRef,
    private slService: SlServiceService,
    private clickIntService: ClickInterceptorService
  ) {

    this.snackbarMessage$ = this.store.pipe(
      select('uiState'),
      select("snackbarMessage"),
    )

    this.sidePanelView$ = this.store.pipe(
      select('uiState'),
      filter(state => isDefined(state)),
      map(state => state.focusedSidePanel),
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
      select('dedicatedView'),
      distinctUntilChanged(),
      map(v => v[v.length -1])
    )

    // TODO temporary hack. even though the front octant is hidden, it seems if a mesh is present, hover will select the said mesh
    this.onhoverSegments$ = this.store.pipe(
      select(uiStateMouseOverSegmentsSelector),
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

    this.overwrittenColorMap$ = this.store.pipe(
      select('viewerState'),
      safeFilter('overwrittenColorMap'),
      map(state => state.overwrittenColorMap),
      distinctUntilChanged()
    )

    const error = this.el.nativeElement.getAttribute('data-error')

    if (error) {
      this.snackbar.open(error, 'Dismiss', { duration: 5000 })
      this.el.nativeElement.removeAttribute('data-error')
    }
  }

  public ngOnInit() {
    this.meetsRequirement = this.meetsRequirements()
    this.clickIntService.addInterceptor(this.selectHoveredRegion.bind(this), true)

    if (KIOSK_MODE) {

      this.subscriptions.push(
        merge(
          fromEvent(window.document, 'mouseup'),
          this.slService.onClick
        ).pipe(
          startWith(true),
          switchMapTo(timer(1000 * 5 * 60).pipe(
            take(1)
          ))
        ).subscribe(() => {
          this.slService.showBackdrop(this.idelTmpl)
        })
      )
  
      this.subscriptions.push(
        this.slService.onClick.subscribe(() => {
          this.slService.hideBackdrop()
        })  
      )
    }

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
      this.onhoverSegments$.subscribe(seg => this.onhoverSegments = seg)
    )

    this.subscriptions.push(
      this.pureConstantService.useTouchUI$.subscribe(bool => this.ismobile = bool),
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
  }

  /**
   * For completeness sake. Root element should never be destroyed.
   */
  public ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe())
    this.clickIntService.removeInterceptor(this.selectHoveredRegion.bind(this))
  }

  private selectHoveredRegion(ev: any, next: Function){
    if (!this.onhoverSegments) return
      
    this.store.dispatch(
      viewerStateSetSelectedRegions({
        selectRegions: this.onhoverSegments.slice(0, 1)
      })
    )
    next()
  }

  public unsetClearViewByKey(key: string){
    // ToDo - In some cases (e.g. connectivity) expanded panel is not directly connected to the viewer
    //  There are cases when panel is expanded but view is not affected, but when we close connectivity chip
    //  sidebar panel should be collapse anyways. That's why additional store dispatch is added here.
    this.store.dispatch({
      type: SET_OVERRITEN_COLOR_MAP,
      payload: false
    })
    this.store.dispatch(
      ngViewerActionClearView({ payload: {
        [key]: false
      }})
    )
  }

  public selectParcellation(parc: any) {
    this.store.dispatch(
      viewerStateHelperSelectParcellationWithId({
        payload: parc
      })
    )
  }

  public bindFns(fns){
    return () => {
      for (const [ fn, ...arg] of fns) {
        fn(...arg)
      }
    }
  }

  public clearAdditionalLayer(layer: { ['@id']: string }){
    this.store.dispatch(
      viewerStateRemoveAdditionalLayer({
        payload: layer
      })
    )
  }

  public clearSelectedRegions(){
    this.store.dispatch(
      viewerStateSetSelectedRegions({
        selectRegions: []
      })
    )
  }

  public mouseClickDocument(_event: MouseEvent) {
    this.clickIntService.run(_event)
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
