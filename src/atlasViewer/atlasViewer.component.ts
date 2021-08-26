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
} from "@angular/core";
import { Store, select, ActionsSubject } from "@ngrx/store";
import { Observable, Subscription, interval, merge, of, timer, fromEvent } from "rxjs";
import { map, filter, distinctUntilChanged, delay, withLatestFrom, switchMapTo, take, startWith } from "rxjs/operators";

import {
  IavRootStoreInterface,
  isDefined,
  safeFilter,
} from "../services/stateStore.service";
import { UNSUPPORTED_INTERVAL, UNSUPPORTED_PREVIEW } from "src/util/constants";
import { WidgetServices } from "src/widget";

import { LocalFileService } from "src/services/localFile.service";
import { AGREE_COOKIE, AGREE_KG_TOS } from "src/services/state/uiState.store";
import { SHOW_KG_TOS } from 'src/services/state/uiState.store.helper'
import { isSame } from "src/util/fn";
import { colorAnimation } from "./atlasViewer.animation"
import { MouseHoverDirective } from "src/mouseoverModule";
import {MatSnackBar, MatSnackBarRef} from "@angular/material/snack-bar";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import { ARIA_LABELS, CONST } from 'common/constants'

import { MIN_REQ_EXPLAINER } from 'src/util/constants'
import { SlServiceService } from "src/spotlight/sl-service.service";
import { PureContantService } from "src/util";
import { ClickInterceptorService } from "src/glue";
import { environment } from 'src/environments/environment'

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

  @ViewChild(MouseHoverDirective) private mouseOverNehuba: MouseHoverDirective

  @ViewChild('idleOverlay', {read: TemplateRef}) idelTmpl: TemplateRef<any>

  @HostBinding('attr.ismobile')
  public ismobile: boolean = false
  public meetsRequirement: boolean = true

  public sidePanelView$: Observable<string|null>
  private newViewer$: Observable<any>

  private snackbarRef: MatSnackBarRef<any>
  public snackbarMessage$: Observable<symbol>

  public onhoverLandmark$: Observable<{landmarkName: string, datasets: any} | null>

  private subscriptions: Subscription[] = []

  public unsupportedPreviewIdx: number = 0
  public unsupportedPreviews: any[] = UNSUPPORTED_PREVIEW

  public MIN_REQ_EXPLAINER = MIN_REQ_EXPLAINER

  private selectedParcellation$: Observable<any>
  public selectedParcellation: any

  private cookieDialogRef: MatDialogRef<any>
  private kgTosDialogRef: MatDialogRef<any>

  constructor(
    private store: Store<IavRootStoreInterface>,
    private widgetServices: WidgetServices,
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

    this.newViewer$ = this.store.pipe(
      select('viewerState'),
      select('templateSelected'),
      distinctUntilChanged(isSame),
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

  public ngOnInit() {
    this.meetsRequirement = this.meetsRequirements()

    if (environment.KIOSK_MODE) {

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

        const message = messageSymbol.description
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
      this.pureConstantService.darktheme$.subscribe(flag => {
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

    // this.onhoverLandmark$ = this.mouseOverNehuba.currentOnHoverObs$.pipe(
    //   select('landmark')
    // )

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
  }

  public mouseClickDocument(event: MouseEvent) {
    this.clickIntService.callRegFns(event)
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

  public quickTourFinale = {
    order: 1e6,
    descriptionMd: `That's it! We hope you enjoy your stay.

---

If you have any comments or need further support, please contact us at [${this.pureConstantService.supportEmailAddress}](mailto:${this.pureConstantService.supportEmailAddress})`,
    description: `That's it! We hope you enjoy your stay. If you have any comments or need further support, please contact us at ${this.pureConstantService.supportEmailAddress}`,
    position: 'center'
  }

  @HostBinding('attr.version')
  public _version: string = environment.VERSION
}

export interface INgLayerInterface {
  name: string
  visible: boolean
  source: string
  type: string // image | segmentation | etc ...
  transform?: [[number, number, number, number], [number, number, number, number], [number, number, number, number], [number, number, number, number]] | null
  // colormap : string
}
