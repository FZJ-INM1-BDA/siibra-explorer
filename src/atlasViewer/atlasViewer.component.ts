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
} from "@angular/core";
import { Store, select } from "@ngrx/store";
import { Observable, Subscription, merge, timer, fromEvent } from "rxjs";
import { filter, delay, switchMapTo, take, startWith } from "rxjs/operators";

import { colorAnimation } from "./atlasViewer.animation"
import { MatSnackBar } from 'src/sharedModules/angularMaterial.exports'
import { MatDialog, MatDialogRef } from "src/sharedModules/angularMaterial.exports";
import { CONST } from 'common/constants'

import { SlServiceService } from "src/spotlight/sl-service.service";
import { ClickInterceptorService } from "src/glue";
import { environment } from 'src/environments/environment'
import { DOCUMENT } from "@angular/common";
import { userPreference } from "src/state"
import { DARKTHEME } from "src/util/injectionTokens";
import { EnumQuickTourSeverity } from "src/ui/quickTour/constrants";
import { SAPI } from "src/atlasComponents/sapi";


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

  sapiError$ = SAPI.ErrorMessage$

  @ViewChild('cookieAgreementComponent', {read: TemplateRef}) public cookieAgreementComponent: TemplateRef<any>

  @ViewChild('idleOverlay', {read: TemplateRef}) idelTmpl: TemplateRef<any>

  @HostBinding('attr.ismobile')
  public ismobile: boolean = false
  public meetsRequirement: boolean = true

  public onhoverLandmark$: Observable<{landmarkName: string, datasets: any} | null>

  private subscriptions: Subscription[] = []

  public selectedParcellation: any

  private cookieDialogRef: MatDialogRef<any>

  public freemode = !!this.el.nativeElement.getAttribute(CONST.FREE_MODE)

  constructor(
    private store: Store<any>,
    private matDialog: MatDialog,
    private rd: Renderer2,
    private snackbar: MatSnackBar,
    private el: ElementRef,
    private slService: SlServiceService,
    private clickIntService: ClickInterceptorService,
    @Inject(DOCUMENT) private document: Document,
    @Inject(DARKTHEME) private darktheme$: Observable<boolean>
  ) {

    // stop propagation of copy event at body level
    // since neuroglancer attach the copy event listener on the document level
    // this prevent the event from reaching neuroglancer
    // and will use the default behavior of copy (i.e. copy selected text)
    this.document.body.addEventListener('copy', ev => {
      ev.stopPropagation()
    }, { capture: true })

    const error = this.el.nativeElement.getAttribute(CONST.DATA_ERROR_ATTR)

    if (error) {
      this.snackbar.open(error, 'Dismiss', { duration: 5000 })
      this.el.nativeElement.removeAttribute(CONST.DATA_ERROR_ATTR)
    }
  }

  public ngOnInit() {
    this.meetsRequirement = this.meetsRequirements()

    if (environment.KIOSK_MODE) {

      this.subscriptions.push(
        merge(
          fromEvent(this.document, 'mouseup'),
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

    this.subscriptions.push(
      this.store.pipe(
        select(userPreference.selectors.useMobileUi),
      ).subscribe(bool => this.ismobile = bool),
    )

    this.subscriptions.push(
      this.darktheme$.subscribe(flag => {
        this.rd.setAttribute(this.document.body, 'darktheme', this.meetsRequirement && flag.toString())
      }),
      this.store.pipe(
        select(userPreference.selectors.showExperimental)
      ).subscribe(flag => {
        this.rd.setAttribute(this.document.body, 'experimental', flag.toString())
      })
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
      this.rd.appendChild(this.document.head, prefecthMainBundle)
    }

    /**
     * Show Cookie disclaimer if not yet agreed
     */
    /**
     * TODO avoid creating new views in lifecycle hooks in general
     */
    this.store.pipe(
      select(userPreference.selectors.agreedToCookie),
      filter(val => !val),
      delay(0),
    ).subscribe(() => {
      this.cookieDialogRef = this.matDialog.open(this.cookieAgreementComponent)
    })

  }

  /**
   * For completeness sake. Root element should never be destroyed.
   */
  public ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe())
  }

  public mouseClickDocument(event: MouseEvent) {
    /**
     * only trigger on primary mouse click
     */
    if (event.button === 0) {
      this.clickIntService.callRegFns(event)
    }
  }

  /**
   * perhaps move this to constructor?
   */
  public meetsRequirements(): boolean {

    const canvas = this.document.createElement('canvas')
    const gl = canvas.getContext('webgl2') as WebGLRenderingContext

    if (!gl) {
      console.error(`Get GLContext failed!`)
      return false
    }

    const colorBufferFloat = gl.getExtension('EXT_color_buffer_float')

    if (!colorBufferFloat) {
      console.error(`Get Extension failed!`)
      return false
    }

    return true
  }

  public cookieClickedOk() {
    if (this.cookieDialogRef) { this.cookieDialogRef.close() }
    this.store.dispatch(
      userPreference.actions.agreeCookie()
    )
  }

  private supportEmailAddress = `support@ebrains.eu`
  public quickTourFinale = {
    order: 1e6,
    descriptionMd: `That's it! We hope you enjoy your stay.

---

If you have any comments or need further support, please contact us at [${this.supportEmailAddress}](mailto:${this.supportEmailAddress})`,
    description: `That's it! We hope you enjoy your stay. If you have any comments or need further support, please contact us at ${this.supportEmailAddress}`,
    position: 'center' as const,
    priority: EnumQuickTourSeverity.LOW
  }

  @HostBinding('attr.version')
  public _version: string = environment.VERSION
}
