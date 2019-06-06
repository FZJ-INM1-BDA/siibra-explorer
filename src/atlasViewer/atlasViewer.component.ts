import { Component, HostBinding, ViewChild, ViewContainerRef, OnDestroy, OnInit, TemplateRef, AfterViewInit, ElementRef } from "@angular/core";
import { Store, select, ActionsSubject } from "@ngrx/store";
import { ViewerStateInterface, isDefined, FETCHED_SPATIAL_DATA, UPDATE_SPATIAL_DATA, TOGGLE_SIDE_PANEL, safeFilter, UIStateInterface, OPEN_SIDE_PANEL, CLOSE_SIDE_PANEL } from "../services/stateStore.service";
import { Observable, Subscription, combineLatest, interval, merge, of, fromEvent } from "rxjs";
import { map, filter, distinctUntilChanged, delay, concatMap, debounceTime, withLatestFrom, switchMap, takeUntil, scan, takeLast } from "rxjs/operators";
import { AtlasViewerDataService } from "./atlasViewer.dataService.service";
import { WidgetServices } from "./widgetUnit/widgetService.service";
import { LayoutMainSide } from "../layouts/mainside/mainside.component";
import { AtlasViewerConstantsServices, UNSUPPORTED_PREVIEW, UNSUPPORTED_INTERVAL } from "./atlasViewer.constantService.service";
import { BsModalService } from "ngx-bootstrap/modal";
import { ModalUnit } from "./modalUnit/modalUnit.component";
import { AtlasViewerURLService } from "./atlasViewer.urlService.service";
import { AtlasViewerAPIServices } from "./atlasViewer.apiService.service";

import '../res/css/extra_styles.css'
import { NehubaContainer } from "../ui/nehubaContainer/nehubaContainer.component";
import { colorAnimation } from "./atlasViewer.animation"
import { FixedMouseContextualContainerDirective } from "src/util/directives/FixedMouseContextualContainerDirective.directive";
import { DatabrowserService } from "src/ui/databrowserModule/databrowser.service";
import { AGREE_COOKIE, AGREE_KG_TOS, SHOW_KG_TOS } from "src/services/state/uiState.store";
import { TabsetComponent } from "ngx-bootstrap/tabs";
import { ToastService } from "src/services/toastService.service";
import { ZipFileDownloadService } from "src/services/zipFileDownload.service";
import {forEach} from "@angular/router/src/utils/collection";

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
  @ViewChild('publications') publications: TemplateRef<any>
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
  public onhoverLandmark$ : Observable<string | null>
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

  handleToast
  tPublication
  pPublication
  downloadingProcess = false
  niiFileSize = 0

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
    private modalService: BsModalService,
    private databrowserService: DatabrowserService,
    private dispatcher$: ActionsSubject,
    private toastService: ToastService,
    private zipFileDownloadService: ZipFileDownloadService,
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
        return spatialDatas[idx].name
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
      map(segments => !segments || segments.length === 0
          ? null
          : segments.map(s => s.segment) )
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
        this.niiFileSize = 0


        if (this.selectedTemplate && this.selectedParcellation) {
          if (this.selectedTemplate['properties'] && this.selectedTemplate['properties']['publications']) {
            this.tPublication = this.selectedTemplate['properties']['publications']
          } else {
            this.tPublication = null
          }
          if (this.selectedParcellation['properties'] && this.selectedParcellation['properties']['publications']) {
            this.pPublication = this.selectedParcellation['properties']['publications']
          } else {
            this.pPublication = null
          }
          if(this.selectedParcellation['properties'] && this.selectedParcellation['properties']['nifty']) {
            this.selectedParcellation['properties']['nifty'].forEach(nii => {
              this.niiFileSize += nii['size']
            })
          }

        } else {
          this.tPublication = null
          this.pPublication = null
        }
        
        if (this.tPublication || this.pPublication) {

          if (this.handleToast) {
            this.handleToast()
            this.handleToast = null
          }
          this.handleToast = this.toastService.showToast(this.publications, {
              timeout: 7000
          })
        }
      })
    )


  }

  downloadPublications() {
    this.downloadingProcess = true

    const fileName = this.selectedTemplate.name + ' - ' + this.selectedParcellation.name
    let publicationsText = ''

    if (this.tPublication) {
      publicationsText += this.selectedTemplate.name + ' Publications:\r\n'
      this.tPublication.forEach((tp, i) => {
        publicationsText += '\t' + (i+1) + '. ' + tp['citation'] + ' - ' + tp['doi'] + '\r\n'
      });
    }

    if (this.pPublication) {
      if (this.tPublication) publicationsText += '\r\n\r\n'
      publicationsText += this.selectedParcellation.name + ' Publications:\r\n'
      this.pPublication.forEach((pp, i) => {
        publicationsText += '\t' + (i+1) + '. ' + pp['citation'] + ' - ' + pp['doi'] + '\r\n'
      });
    }
    
    this.zipFileDownloadService.downloadZip(
        publicationsText,
        fileName,
        this.selectedParcellation['properties'] && this.selectedParcellation['properties']['nifty']? this.selectedParcellation['properties']['nifty'] : 0).subscribe(data => {
      this.downloadingProcess = false
    })
    publicationsText = ''
  }


  private selectedParcellation$: Observable<any>
  private selectedParcellation: any

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
      this.showHelp$.subscribe(() => 
        this.modalService.show(ModalUnit, {
          initialState: {
            title: this.constantsService.showHelpTitle,
            template: this.helpComponent
          }
        })
      )
    )

    this.subscriptions.push(
      this.constantsService.showSigninSubject$.pipe(
        debounceTime(160)
      ).subscribe(user => {
        this.modalService.show(ModalUnit, {
          initialState: {
            title: user ? 'Logout' : `Login`,
            template: this.signinModalComponent
          }
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
  }

  ngAfterViewInit() {
    
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
      this.modalService.show(ModalUnit, {
        initialState: {
          title: 'Cookie Disclaimer',
          template: this.cookieAgreementComponent
        }
      }) 
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
      this.modalService.show(ModalUnit, {
        initialState: {
          title: 'Knowldge Graph ToS',
          template: this.kgTosComponent
        }
      })
    })

    this.onhoverSegmentsForFixed$ = this.rClContextualMenu.onShow.pipe(
      withLatestFrom(this.onhoverSegments$),
      map(([_flag, onhoverSegments]) => onhoverSegments || [])
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
      this.modalService.show(ModalUnit,{
        initialState: {
          title: this.constantsService.mobileWarningHeader,
          body: this.constantsService.mobileWarning
        }
      })
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
    this.modalService.hide(1)
    this.store.dispatch({
      type: AGREE_KG_TOS
    })
  }

  cookieClickedOk(){
    this.modalService.hide(1)
    this.store.dispatch({
      type: AGREE_COOKIE
    })
  }

  panelAnimationEnd(){

    if( this.nehubaContainer && this.nehubaContainer.nehubaViewer && this.nehubaContainer.nehubaViewer.nehubaViewer )
      this.nehubaContainer.nehubaViewer.nehubaViewer.redraw()
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


  closeMenuWithSwipe(documentToSwipe: ElementRef) {
    const swipeDistance = 150; // swipe distance
    const swipeLeft$ = fromEvent(documentToSwipe.nativeElement, "touchstart")
        .pipe(
          switchMap(startEvent =>
            fromEvent(documentToSwipe.nativeElement, "touchmove")
                .pipe(
                  takeUntil(fromEvent(documentToSwipe.nativeElement, "touchend"))
                  ,map(event => event['touches'][0].pageX)
                  ,scan((acc, pageX) => Math.round(startEvent['touches'][0].pageX - pageX), 0)
                  ,takeLast(1)
                  ,filter(difference => difference >= swipeDistance)
                )))
    // Subscription
    swipeLeft$.subscribe(val => {
      this.changeMenuState({close: true})
    })
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
