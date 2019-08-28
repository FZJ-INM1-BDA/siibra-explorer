import { Component, HostBinding, ViewChild, ViewContainerRef, OnDestroy, OnInit, TemplateRef, AfterViewInit, ElementRef, Renderer2 } from "@angular/core";
import { Store, select, ActionsSubject } from "@ngrx/store";
import { ViewerStateInterface, isDefined, FETCHED_SPATIAL_DATA, UPDATE_SPATIAL_DATA, TOGGLE_SIDE_PANEL, safeFilter, UIStateInterface, OPEN_SIDE_PANEL, CLOSE_SIDE_PANEL } from "../services/stateStore.service";
import { Observable, Subscription, combineLatest, interval, merge, of, fromEvent } from "rxjs";
import { map, filter, distinctUntilChanged, delay, concatMap, debounceTime, withLatestFrom, switchMap, takeUntil, scan, takeLast } from "rxjs/operators";
import { AtlasViewerDataService } from "./atlasViewer.dataService.service";
import { WidgetServices } from "./widgetUnit/widgetService.service";
import { LayoutMainSide } from "../layouts/mainside/mainside.component";
import { AtlasViewerConstantsServices, UNSUPPORTED_PREVIEW, UNSUPPORTED_INTERVAL } from "./atlasViewer.constantService.service";
import { AtlasViewerURLService } from "./atlasViewer.urlService.service";
import { AtlasViewerAPIServices } from "./atlasViewer.apiService.service";

import { NehubaContainer } from "../ui/nehubaContainer/nehubaContainer.component";
import { colorAnimation } from "./atlasViewer.animation"
import { FixedMouseContextualContainerDirective } from "src/util/directives/FixedMouseContextualContainerDirective.directive";
import { DatabrowserService } from "src/ui/databrowserModule/databrowser.service";
import { AGREE_COOKIE, AGREE_KG_TOS, SHOW_KG_TOS } from "src/services/state/uiState.store";
import { TabsetComponent } from "ngx-bootstrap/tabs";
import { MatDialog, MatDialogRef } from "@angular/material";

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

  @ViewChild('floatingMouseContextualContainer', { read: ViewContainerRef }) floatingMouseContextualContainer: ViewContainerRef
  @ViewChild('helpComponent', {read: TemplateRef}) helpComponent : TemplateRef<any>
  @ViewChild('signinModalComponent', {read: TemplateRef}) signinModalComponent : TemplateRef<any>
  @ViewChild('cookieAgreementComponent', {read: TemplateRef}) cookieAgreementComponent : TemplateRef<any>
  @ViewChild('kgToS', {read: TemplateRef}) kgTosComponent: TemplateRef<any>
  @ViewChild(LayoutMainSide) layoutMainSide: LayoutMainSide

  @ViewChild(NehubaContainer) nehubaContainer: NehubaContainer

  @ViewChild(FixedMouseContextualContainerDirective) rClContextualMenu: FixedMouseContextualContainerDirective

  @ViewChild('mobileMenuTabs') mobileMenuTabs: TabsetComponent
  @ViewChild('sidenav', { read: ElementRef} ) mobileSideNav: ElementRef

  /**
   * required for styling of all child components
   */
  @HostBinding('attr.darktheme')
  darktheme: boolean = false

  @HostBinding('attr.ismobile')
  get isMobile(){
    return this.constantsService.mobile
  }

  meetsRequirement: boolean = true

  public sidePanelView$: Observable<string|null>
  private newViewer$: Observable<any>

  public selectedRegions$: Observable<any[]>
  public selectedPOI$ : Observable<any[]>
  private showHelp$: Observable<any>

  public dedicatedView$: Observable<string | null>
  public onhoverSegments$: Observable<string[]>
  public onhoverSegmentsForFixed$: Observable<string[]>
  public onhoverLandmarksForFixed$: Observable<any>
  public onhoverLandmark$ : Observable<{landmarkName: string, datasets: any} | null>
  private subscriptions: Subscription[] = []

  /* handlers for nglayer */
  /**
   * TODO make untangle nglayernames and its dependency on ng
   */
  public ngLayerNames$ : Observable<any>
  public ngLayers : NgLayerInterface[]
  private disposeHandler : any

  public unsupportedPreviewIdx: number = 0
  public unsupportedPreviews: any[] = UNSUPPORTED_PREVIEW

  public sidePanelOpen$: Observable<boolean>

  get toggleMessage(){
    return this.constantsService.toggleMessage
  }

  constructor(
    private store: Store<ViewerStateInterface>,
    public dataService: AtlasViewerDataService,
    private widgetServices: WidgetServices,
    private constantsService: AtlasViewerConstantsServices,
    public urlService: AtlasViewerURLService,
    public apiService: AtlasViewerAPIServices,
    private matDialog: MatDialog,
    private databrowserService: DatabrowserService,
    private dispatcher$: ActionsSubject,
    private rd: Renderer2
  ) {
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

    this.showHelp$ = this.constantsService.showHelpSubject$.pipe(
      debounceTime(170)
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
        if(isNaN(idx))
          return `Landmark index could not be parsed as a number: ${landmark}`
        return  {
                  landmarkName: spatialDatas[idx].name,
                  datasets: (spatialDatas[idx].dataset
                      && spatialDatas[idx].dataset.length)? spatialDatas[idx].dataset : null
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
        if (!segments)
          return null
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
      this.newViewer$.subscribe(template => this.selectedTemplate = template)
    )

    this.subscriptions.push(
      this.selectedParcellation$.subscribe(parcellation => {
        this.selectedParcellation = parcellation
      })
    )
  }


  private selectedParcellation$: Observable<any>
  private selectedParcellation: any

  private cookieDialogRef: MatDialogRef<any>
  private kgTosDialogRef: MatDialogRef<any>
  private helpDialogRef: MatDialogRef<any>
  private loginDialogRef: MatDialogRef<any>

  ngOnInit() {
    this.meetsRequirement = this.meetsRequirements()

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
      this.showHelp$.subscribe(() => {
        this.helpDialogRef = this.matDialog.open(this.helpComponent, {
          autoFocus: false
        })
      })
    )

    this.subscriptions.push(
      this.constantsService.showSigninSubject$.pipe(
        debounceTime(160)
      ).subscribe(user => {
        this.loginDialogRef = this.matDialog.open(this.signinModalComponent, {
          autoFocus: false
        })
      })
    )

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

    this.onhoverLandmarksForFixed$ = this.rClContextualMenu.onShow.pipe(
        withLatestFrom(this.onhoverLandmark$),
        map(([_flag, onhoverLandmark]) => onhoverLandmark || [])
    )

    this.closeMenuWithSwipe(this.mobileSideNav)
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
  meetsRequirements() {

    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') as WebGLRenderingContext

    if (!gl) {
      return false
    }

    const colorBufferFloat = gl.getExtension('EXT_color_buffer_float')
    
    if (!colorBufferFloat) {
      return false
    }

    if(this.constantsService.mobile){
      /**
       * TODO change to snack bar in future
       */
      
      // this.modalService.show(ModalUnit,{
      //   initialState: {
      //     title: this.constantsService.mobileWarningHeader,
      //     body: this.constantsService.mobileWarning
      //   }
      // })
    }
    return true
  }

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

  panelAnimationEnd(){
    if( this.nehubaContainer && this.nehubaContainer.nehubaViewer && this.nehubaContainer.nehubaViewer.nehubaViewer ) {
      this.nehubaContainer.nehubaViewer.nehubaViewer.redraw()
    }
  }

  nehubaClickHandler(event:MouseEvent){
    if (!this.rClContextualMenu) return
    this.rClContextualMenu.mousePos = [
      event.clientX,
      event.clientY
    ]
    this.rClContextualMenu.show()
  }

  toggleSidePanel(panelName:string){
    this.store.dispatch({
      type : TOGGLE_SIDE_PANEL,
      focusedSidePanel :panelName
    })
  }

  private selectedTemplate: any
  searchRegion(regions:any[]){
    this.rClContextualMenu.hide()
    this.databrowserService.queryData({ regions, parcellation: this.selectedParcellation, template: this.selectedTemplate })
    if (this.isMobile) {
      this.store.dispatch({
        type : OPEN_SIDE_PANEL
      })
      this.mobileMenuTabs.tabs[1].active = true
    }
  }

  openLandmarkUrl(dataset) {
    this.rClContextualMenu.hide()
    window.open(dataset.externalLink, "_blank")
  }

  @HostBinding('attr.version')
  public _version : string = VERSION

  changeMenuState({open, close}:{open?:boolean, close?:boolean} = {}) {
    if (open) {
      return this.store.dispatch({
        type: OPEN_SIDE_PANEL
      })
    }
    if (close) {
      return this.store.dispatch({
        type: CLOSE_SIDE_PANEL
      })
    }
    this.store.dispatch({
      type: TOGGLE_SIDE_PANEL
    })
  }

  closeModal(mode){
    if (mode === 'help') {
      this.helpDialogRef && this.helpDialogRef.close()
    }

    if (mode === 'login') {
      this.loginDialogRef && this.loginDialogRef.close()
    }
  }

  closeMenuWithSwipe(documentToSwipe: ElementRef) {
    if (documentToSwipe && documentToSwipe.nativeElement) {
      const swipeDistance = 150; // swipe distance
      const swipeLeft$ = fromEvent(documentToSwipe.nativeElement, 'touchstart')
          .pipe(
              switchMap(startEvent =>
                  fromEvent(documentToSwipe.nativeElement, 'touchmove')
                      .pipe(
                          takeUntil(fromEvent(documentToSwipe.nativeElement, 'touchend')),
                          map(event => event['touches'][0].pageX),
                          scan((acc, pageX) => Math.round(startEvent['touches'][0].pageX - pageX), 0),
                          takeLast(1),
                          filter(difference => difference >= swipeDistance)
                      )))
      this.subscriptions.push(
        swipeLeft$.subscribe(() => {
          this.changeMenuState({close: true})
        })
      )
    }
  }

}

export interface NgLayerInterface{
  name : string
  visible : boolean
  source : string
  type : string // image | segmentation | etc ...
  transform? : [[number, number, number, number],[number, number, number, number],[number, number, number, number],[number, number, number, number]] | null
  // colormap : string
}
