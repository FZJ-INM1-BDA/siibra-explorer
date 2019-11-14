import { Component, HostBinding, ViewChild, ViewContainerRef, OnDestroy, OnInit, TemplateRef, AfterViewInit, Renderer2 } from "@angular/core";
import { Store, select, ActionsSubject } from "@ngrx/store";
import { ViewerStateInterface, isDefined, FETCHED_SPATIAL_DATA, UPDATE_SPATIAL_DATA, safeFilter } from "../services/stateStore.service";
import { Observable, Subscription, combineLatest, interval, merge, of, timer, fromEvent } from "rxjs";
import { map, filter, distinctUntilChanged, delay, concatMap, withLatestFrom, switchMapTo, take, tap, startWith } from "rxjs/operators";
import { AtlasViewerDataService } from "./atlasViewer.dataService.service";
import { WidgetServices } from "./widgetUnit/widgetService.service";
import { LayoutMainSide } from "../layouts/mainside/mainside.component";
import { AtlasViewerConstantsServices, UNSUPPORTED_PREVIEW, UNSUPPORTED_INTERVAL } from "./atlasViewer.constantService.service";
import { AtlasViewerURLService } from "./atlasViewer.urlService.service";
import { AtlasViewerAPIServices } from "./atlasViewer.apiService.service";

import { NehubaContainer } from "../ui/nehubaContainer/nehubaContainer.component";
import { colorAnimation } from "./atlasViewer.animation"
import { FixedMouseContextualContainerDirective } from "src/util/directives/FixedMouseContextualContainerDirective.directive";
import { AGREE_COOKIE, AGREE_KG_TOS, SHOW_KG_TOS, SHOW_BOTTOM_SHEET } from "src/services/state/uiState.store";
import { TabsetComponent } from "ngx-bootstrap/tabs";
import { LocalFileService } from "src/services/localFile.service";
import { MatDialog, MatDialogRef, MatSnackBar, MatSnackBarRef, MatBottomSheet, MatBottomSheetRef } from "@angular/material";
import { SlServiceService } from "src/spotlight/sl-service.service";

/**
 * TODO
 * check against auxlillary mesh indicies, to only filter out aux indicies
 */
const filterFn = (segment) => typeof segment.segment !== 'string'

@Component({
  selector: 'atlas-viewer',
  templateUrl: './atlasViewer.template.html',
  styleUrls: [
    `./atlasViewer.style.css`
  ],
  animations : [
    colorAnimation
  ]
})

export class AtlasViewer implements OnDestroy, OnInit, AfterViewInit {
  
  @ViewChild('cookieAgreementComponent', {read: TemplateRef}) cookieAgreementComponent : TemplateRef<any>
  @ViewChild('kgToS', {read: TemplateRef}) kgTosComponent: TemplateRef<any>
  @ViewChild(LayoutMainSide) layoutMainSide: LayoutMainSide

  @ViewChild(NehubaContainer) nehubaContainer: NehubaContainer

  @ViewChild(FixedMouseContextualContainerDirective) rClContextualMenu: FixedMouseContextualContainerDirective

  @ViewChild('mobileMenuTabs') mobileMenuTabs: TabsetComponent

  @ViewChild('idleOverlay', {read: TemplateRef}) idelTmpl: TemplateRef<any>

  /**
   * required for styling of all child components
   */
  @HostBinding('attr.darktheme')
  darktheme: boolean = false

  @HostBinding('attr.ismobile')
  public ismobile: boolean = false

  meetsRequirement: boolean = true

  public sidePanelView$: Observable<string|null>
  private newViewer$: Observable<any>

  public selectedRegions$: Observable<any[]>
  public selectedPOI$ : Observable<any[]>
  
  private snackbarRef: MatSnackBarRef<any>
  public snackbarMessage$: Observable<string>
  private bottomSheetRef: MatBottomSheetRef
  private bottomSheet$: Observable<TemplateRef<any>>

  public dedicatedView$: Observable<string | null>
  public onhoverSegments$: Observable<string[]>
  public onhoverSegmentsForFixed$: Observable<string[]>
  
  public onhoverLandmark$ : Observable<{landmarkName: string, datasets: any} | null>
  private subscriptions: Subscription[] = []

  /* handlers for nglayer */
  /**
   * TODO make untangle nglayernames and its dependency on ng
   * TODO deprecated
   */
  public ngLayerNames$ : Observable<any>
  public ngLayers : NgLayerInterface[]
  private disposeHandler : any

  public unsupportedPreviewIdx: number = 0
  public unsupportedPreviews: any[] = UNSUPPORTED_PREVIEW

  public sidePanelOpen$: Observable<boolean>

  public toggleMessage = this.constantsService.toggleMessage

  constructor(
    private store: Store<ViewerStateInterface>,
    public dataService: AtlasViewerDataService,
    private widgetServices: WidgetServices,
    private constantsService: AtlasViewerConstantsServices,
    public urlService: AtlasViewerURLService,
    public apiService: AtlasViewerAPIServices,
    private matDialog: MatDialog,
    private dispatcher$: ActionsSubject,
    private rd: Renderer2,
    public localFileService: LocalFileService,
    private snackbar: MatSnackBar,
    private bottomSheet: MatBottomSheet,
    private slService: SlServiceService
  ) {

    this.snackbarMessage$ = this.store.pipe(
      select('uiState'),
      select("snackbarMessage")
    )

    this.bottomSheet$ = this.store.pipe(
      select('uiState'),
      select('bottomSheetTemplate'),
      distinctUntilChanged()
    )

    /**
     * TODO deprecated
     */
    this.ngLayerNames$ = this.store.pipe(
      select('viewerState'),
      filter(state => isDefined(state) && isDefined(state.templateSelected)),
      distinctUntilChanged((o,n) => o.templateSelected.name === n.templateSelected.name),
      map(state => Object.keys(state.templateSelected.nehubaConfig.dataset.initialNgState.layers)),
      delay(0)
    )

    this.sidePanelView$ = this.store.pipe(
      select('uiState'),  
      filter(state => isDefined(state)),
      map(state => state.focusedSidePanel)
    )

    this.sidePanelOpen$ = this.store.pipe(
      select('uiState'),  
      filter(state => isDefined(state)),
      map(state => state.sidePanelOpen)
    )

    this.selectedRegions$ = this.store.pipe(
      select('viewerState'),
      filter(state=>isDefined(state)&&isDefined(state.regionsSelected)),
      map(state=>state.regionsSelected),
      distinctUntilChanged()
    )

    this.selectedPOI$ = combineLatest(
      this.selectedRegions$,
      this.store.pipe(
        select('viewerState'),
        filter(state => isDefined(state) && isDefined(state.landmarksSelected)),
        map(state => state.landmarksSelected),
        distinctUntilChanged()
      )
    ).pipe(
      map(results => [...results[0], ...results[1]])
    )

    this.newViewer$ = this.store.pipe(
      select('viewerState'),
      filter(state => isDefined(state) && isDefined(state.templateSelected)),
      map(state => state.templateSelected),
      distinctUntilChanged((t1, t2) => t1.name === t2.name)
    )

    this.dedicatedView$ = this.store.pipe(
      select('viewerState'),
      filter(state => isDefined(state) && typeof state.dedicatedView !== 'undefined'),
      map(state => state.dedicatedView),
      distinctUntilChanged()
    )

    this.onhoverLandmark$ = combineLatest(
      this.store.pipe(
        select('uiState'),
        map(state => state.mouseOverLandmark)
      ),
      this.store.pipe(
        select('dataStore'),
        safeFilter('fetchedSpatialData'),
        map(state=>state.fetchedSpatialData)
      )
    ).pipe(
      map(([landmark, spatialDatas]) => {
        if(landmark === null)
          return landmark
        const idx = Number(landmark.replace('label=',''))
        if(isNaN(idx)) {
          console.warn(`Landmark index could not be parsed as a number: ${landmark}`)
          return {
            landmarkName: idx
          }
        } else {
          return  {
            landmarkName: spatialDatas[idx].name
          }
        }
      })
    )

    // TODO temporary hack. even though the front octant is hidden, it seems if a mesh is present, hover will select the said mesh
    this.onhoverSegments$ = combineLatest(
      this.store.pipe(
        select('uiState'),
        select('mouseOverSegments'),
        filter(v => !!v),
        distinctUntilChanged((o, n) => o.length === n.length && n.every(segment => o.find(oSegment => oSegment.layer.name === segment.layer.name && oSegment.segment === segment.segment) ) )
        /* cannot filter by state, as the template expects a default value, or it will throw ExpressionChangedAfterItHasBeenCheckedError */

      ),
      this.onhoverLandmark$
    ).pipe(
      map(([segments, onhoverLandmark]) => onhoverLandmark ? null : segments ),
      map(segments => {
        if (!segments) return null
        const filteredSeg = segments.filter(filterFn)
        return filteredSeg.length > 0
          ? segments.map(s => s.segment) 
          : null
        })
    )

    this.selectedParcellation$ = this.store.pipe(
      select('viewerState'),
      safeFilter('parcellationSelected'),
      map(state=>state.parcellationSelected),
      distinctUntilChanged(),
    )

    this.subscriptions.push(
      this.selectedParcellation$.subscribe(parcellation => {
        this.selectedParcellation = parcellation
      })
    )

    this.subscriptions.push(
      this.bottomSheet$.subscribe(templateRef => {
        if (!templateRef) {
          this.bottomSheetRef && this.bottomSheetRef.dismiss()
        } else {
          this.bottomSheetRef = this.bottomSheet.open(templateRef)
          this.bottomSheetRef.afterDismissed().subscribe(() => {
            this.store.dispatch({
              type: SHOW_BOTTOM_SHEET,
              bottomSheetTemplate: null
            })
            this.bottomSheetRef = null
          })
        }
      })
    )
  }


  private selectedParcellation$: Observable<any>
  private selectedParcellation: any

  private cookieDialogRef: MatDialogRef<any>
  private kgTosDialogRef: MatDialogRef<any>

  ngOnInit() {
    this.meetsRequirement = this.meetsRequirements()

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

    if (!this.meetsRequirement) {
      merge(
        of(-1),
        interval(UNSUPPORTED_INTERVAL)
      ).pipe(
        map(v => {
          let idx = v
          while (idx < 0) {
            idx = v + this.unsupportedPreviews.length
          }
          return idx % this.unsupportedPreviews.length
        })
      ).subscribe(val => {
        this.unsupportedPreviewIdx = val
      })
    }

    this.subscriptions.push(
      this.constantsService.useMobileUI$.subscribe(bool => this.ismobile = bool)
    )

    this.subscriptions.push(
      this.snackbarMessage$.pipe(
        // angular material issue
        // see https://github.com/angular/angular/issues/15634
        // and https://github.com/angular/components/issues/11357
        delay(0),
      ).subscribe(messageSymbol => {
        this.snackbarRef && this.snackbarRef.dismiss()

        if (!messageSymbol) return

        // https://stackoverflow.com/a/48191056/6059235
        const message = messageSymbol.toString().slice(7, -1)
        this.snackbarRef = this.snackbar.open(message, 'Dismiss', {
          duration: 5000
        })
      })
    )

    /**
     * TODO deprecated
     */
    this.subscriptions.push(
      this.ngLayerNames$.pipe(
        concatMap(data => this.constantsService.loadExportNehubaPromise.then(data))
      ).subscribe(() => {
        this.ngLayersChangeHandler()
        this.disposeHandler = window['viewer'].layerManager.layersChanged.add(() => this.ngLayersChangeHandler())
        window['viewer'].registerDisposer(this.disposeHandler)
      })
    )

    this.subscriptions.push(
      this.newViewer$.subscribe(template => {
        this.darktheme = this.meetsRequirement ?
          template.useTheme === 'dark' :
          false

        this.constantsService.darktheme = this.darktheme
        
        /* new viewer should reset the spatial data search */
        this.store.dispatch({
          type : FETCHED_SPATIAL_DATA,
          fetchedDataEntries : []
        })
        this.store.dispatch({
          type : UPDATE_SPATIAL_DATA,
          totalResults : 0
        })

        this.widgetServices.clearAllWidgets()
      })
    )

    this.subscriptions.push(
      this.sidePanelView$.pipe(
        filter(() => typeof this.layoutMainSide !== 'undefined')
      ).subscribe(v => this.layoutMainSide.showSide =  isDefined(v))
    )

    this.subscriptions.push(
      this.constantsService.darktheme$.subscribe(flag => {
        this.rd.setAttribute(document.body,'darktheme', flag.toString())
      })
    )
  }

  ngAfterViewInit() {
    
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
      delay(0)
    ).subscribe(() => {
      this.cookieDialogRef = this.matDialog.open(this.cookieAgreementComponent)
    })

    this.dispatcher$.pipe(
      filter(({type}) => type === SHOW_KG_TOS),
      withLatestFrom(this.store.pipe(
        select('uiState'),
        select('agreedKgTos')
      )),
      map(([_, agreed]) => agreed),
      filter(flag => !flag),
      delay(0)
    ).subscribe(val => {
      this.kgTosDialogRef = this.matDialog.open(this.kgTosComponent)
    })

    this.onhoverSegmentsForFixed$ = this.rClContextualMenu.onShow.pipe(
      withLatestFrom(this.onhoverSegments$),
      map(([_flag, onhoverSegments]) => onhoverSegments || [])
    )
  }

  /**
   * For completeness sake. Root element should never be destroyed. 
   */
  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe())
  }

  /**
   * perhaps move this to constructor?
   */
  meetsRequirements():boolean {

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
  ngLayersChangeHandler(){
    this.ngLayers = (window['viewer'].layerManager.managedLayers as any[])
      // .filter(obj => obj.sourceUrl && /precomputed|nifti/.test(obj.sourceUrl))
      .map(obj => ({
        name : obj.name,
        type : obj.initialSpecification.type,
        source : obj.sourceUrl,
        visible : obj.visible
      }) as NgLayerInterface)
  }

  kgTosClickedOk(){
    this.kgTosDialogRef && this.kgTosDialogRef.close()
    this.store.dispatch({
      type: AGREE_KG_TOS
    })
  }

  cookieClickedOk(){
    this.cookieDialogRef && this.cookieDialogRef.close()
    this.store.dispatch({
      type: AGREE_COOKIE
    })
  }

  nehubaClickHandler(event:MouseEvent){
    if (!this.rClContextualMenu) return
    this.rClContextualMenu.mousePos = [
      event.clientX,
      event.clientY
    ]
    this.rClContextualMenu.show()
  }

  openLandmarkUrl(dataset) {
    this.rClContextualMenu.hide()
    window.open(dataset.externalLink, "_blank")
  }

  @HostBinding('attr.version')
  public _version : string = VERSION
}

export interface NgLayerInterface{
  name : string
  visible : boolean
  source : string
  type : string // image | segmentation | etc ...
  transform? : [[number, number, number, number],[number, number, number, number],[number, number, number, number],[number, number, number, number]] | null
  // colormap : string
}
