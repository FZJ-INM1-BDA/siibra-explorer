import { Component, HostBinding, ViewChild, ViewContainerRef, OnDestroy, ElementRef, OnInit, HostListener, TemplateRef } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { ViewerStateInterface, isDefined, FETCHED_SPATIAL_DATA, UPDATE_SPATIAL_DATA, TOGGLE_SIDE_PANEL, safeFilter } from "../services/stateStore.service";
import { Observable, Subscription, combineLatest } from "rxjs";
import { map, filter, distinctUntilChanged, delay, concatMap, debounceTime } from "rxjs/operators";
import { AtlasViewerDataService } from "./atlasViewer.dataService.service";
import { WidgetServices } from "./widgetUnit/widgetService.service";
import { LayoutMainSide } from "../layouts/mainside/mainside.component";
import { Chart } from 'chart.js'
import { AtlasViewerConstantsServices } from "./atlasViewer.constantService.service";
import { BsModalService } from "ngx-bootstrap/modal";
import { ModalUnit } from "./modalUnit/modalUnit.component";
import { AtlasViewerURLService } from "./atlasViewer.urlService.service";
import { AtlasViewerAPIServices } from "./atlasViewer.apiService.service";

import '../res/css/extra_styles.css'
import { NehubaContainer } from "../ui/nehubaContainer/nehubaContainer.component";
import { colorAnimation } from "./atlasViewer.animation"

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

export class AtlasViewer implements OnDestroy, OnInit {

  @ViewChild('databrowser', { read: ElementRef }) databrowser: ElementRef
  @ViewChild('floatingMouseContextualContainer', { read: ViewContainerRef }) floatingMouseContextualContainer: ViewContainerRef
  @ViewChild('helpComponent', {read: TemplateRef}) helpComponent : TemplateRef<any>
  @ViewChild('viewerConfigComponent', {read: TemplateRef}) viewerConfigComponent : TemplateRef<any>
  @ViewChild('loginComponent', {read: TemplateRef}) loginComponent: TemplateRef <any>
  @ViewChild(LayoutMainSide) layoutMainSide: LayoutMainSide

  @ViewChild(NehubaContainer) nehubaContainer: NehubaContainer

  /**
   * required for styling of all child components
   */
  @HostBinding('attr.darktheme')
  darktheme: boolean = false

  meetsRequirement: boolean = true

  public sidePanelView$: Observable<string|null>
  private newViewer$: Observable<any>

  public selectedPOI$ : Observable<any[]>
  private showHelp$: Observable<any>
  private showConfig$: Observable<any>

  public dedicatedView$: Observable<string | null>
  public onhoverSegment$: Observable<string>
  public onhoverLandmark$ : Observable<string | null>
  private subscriptions: Subscription[] = []

  /* handlers for nglayer */
  /**
   * TODO make untangle nglayernames and its dependency on ng
   */
  public ngLayerNames$ : Observable<any>
  public ngLayers : NgLayerInterface[]
  private disposeHandler : any

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
    private modalService: BsModalService
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

    this.showHelp$ = this.constantsService.showHelpSubject$.pipe(
      debounceTime(170)
    )

    this.showConfig$ = this.constantsService.showConfigSubject$.pipe(
      debounceTime(170)
    )

    this.selectedPOI$ = combineLatest(
      this.store.pipe(
        select('viewerState'),
        filter(state=>isDefined(state)&&isDefined(state.regionsSelected)),
        map(state=>state.regionsSelected),
        distinctUntilChanged()
      ),
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
    this.onhoverSegment$ = combineLatest(
      this.store.pipe(
        select('uiState'),
        /* cannot filter by state, as the template expects a default value, or it will throw ExpressionChangedAfterItHasBeenCheckedError */
        map(state => isDefined(state) ?
          state.mouseOverSegment ?
            state.mouseOverSegment.constructor === Number ?
              state.mouseOverSegment.toString() :
              state.mouseOverSegment.name :
            null :
          null),
        distinctUntilChanged()
      ),
      this.onhoverLandmark$
    ).pipe(
      map(([segment, onhoverLandmark]) => onhoverLandmark ? null : segment )
    )

  }

  ngOnInit() {
    this.meetsRequirement = this.meetsRequirements()

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
      this.showConfig$.subscribe(() => {
        this.modalService.show(ModalUnit, {
          initialState: {
            title: this.constantsService.showConfigTitle,
            template: this.viewerConfigComponent
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

    /**
     * Because there is no easy way to display standard deviation natively, use a plugin 
     * */
    Chart.pluginService.register({

      /* patching background color fill, so saved images do not look completely white */
      beforeDraw: (chart) => {
        const ctx = chart.ctx as CanvasRenderingContext2D;
        ctx.fillStyle = this.darktheme ?
          `rgba(50,50,50,0.8)` :
          `rgba(255,255,255,0.8)`

        if (chart.canvas) ctx.fillRect(0, 0, chart.canvas.width, chart.canvas.height)

      },

      /* patching standard deviation for polar (potentially also line/bar etc) graph */
      afterInit: (chart) => {
        if (chart.config.options && chart.config.options.tooltips) {

          chart.config.options.tooltips.callbacks = {
            label: function (tooltipItem, data) {
              let sdValue
              if (data.datasets && typeof tooltipItem.datasetIndex != 'undefined' && data.datasets[tooltipItem.datasetIndex].label) {
                const sdLabel = data.datasets[tooltipItem.datasetIndex].label + '_sd'
                const sd = data.datasets.find(dataset => typeof dataset.label != 'undefined' && dataset.label == sdLabel)
                if (sd && sd.data && typeof tooltipItem.index != 'undefined' && typeof tooltipItem.yLabel != 'undefined') sdValue = Number(sd.data[tooltipItem.index]) - Number(tooltipItem.yLabel)
              }
              return `${tooltipItem.yLabel} ${sdValue ? '(' + sdValue + ')' : ''}`
            }
          }
        }
        if (chart.data.datasets) {
          chart.data.datasets = chart.data.datasets
            .map(dataset => {
              if (dataset.label && /\_sd$/.test(dataset.label)) {
                const originalDS = chart.data.datasets!.find(baseDS => typeof baseDS.label !== 'undefined' && (baseDS.label == dataset.label!.replace(/_sd$/, '')))
                if (originalDS) {
                  return Object.assign({}, dataset, {
                    data: (originalDS.data as number[]).map((datapoint, idx) => (Number(datapoint) + Number((dataset.data as number[])[idx]))),
                    ... this.constantsService.chartSdStyle
                  })
                } else {
                  return dataset
                }
              } else if (dataset.label) {
                const sdDS = chart.data.datasets!.find(sdDS => typeof sdDS.label !== 'undefined' && (sdDS.label == dataset.label + '_sd'))
                if (sdDS) {
                  return Object.assign({}, dataset, {
                    ...this.constantsService.chartBaseStyle
                  })
                } else {
                  return dataset
                }
              } else {
                return dataset
              }
            })
        }
      }
    })
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

  panelAnimationEnd(){

    if( this.nehubaContainer && this.nehubaContainer.nehubaViewer && this.nehubaContainer.nehubaViewer.nehubaViewer )
      this.nehubaContainer.nehubaViewer.nehubaViewer.redraw()
  }

  toggleSidePanel(panelName:string){
    this.store.dispatch({
      type : TOGGLE_SIDE_PANEL,
      focusedSidePanel :panelName
    })
  }

  @HostBinding('attr.version')
  public _version : string = VERSION

  get isMobile(){
    return this.constantsService.mobile
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
