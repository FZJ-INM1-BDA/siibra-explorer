import { Component, ViewChild, ViewContainerRef, ComponentFactoryResolver, ComponentFactory, ComponentRef, OnInit, OnDestroy, ElementRef } from "@angular/core";
import { NehubaViewerUnit } from "./nehubaViewer/nehubaViewer.component";
import { Store, select } from "@ngrx/store";
import { ViewerStateInterface, safeFilter, CHANGE_NAVIGATION, isDefined, USER_LANDMARKS, ADD_NG_LAYER, REMOVE_NG_LAYER, NgViewerStateInterface, MOUSE_OVER_LANDMARK, SELECT_LANDMARKS, Landmark, PointLandmarkGeometry, PlaneLandmarkGeometry, OtherLandmarkGeometry, getNgIds, getMultiNgIdsRegionsLabelIndexMap, generateLabelIndexId } from "../../services/stateStore.service";
import { Observable, Subscription, fromEvent, combineLatest, merge } from "rxjs";
import { filter,map, take, scan, debounceTime, distinctUntilChanged, switchMap, skip, withLatestFrom, buffer, tap, throttleTime, bufferTime } from "rxjs/operators";
import { AtlasViewerAPIServices, UserLandmark } from "../../atlasViewer/atlasViewer.apiService.service";
import { timedValues } from "../../util/generator";
import { AtlasViewerConstantsServices } from "../../atlasViewer/atlasViewer.constantService.service";
import { ViewerConfiguration } from "src/services/state/viewerConfig.store";
import { pipeFromArray } from "rxjs/internal/util/pipe";
import { NEHUBA_READY } from "src/services/state/ngViewerState.store";
import { MOUSE_OVER_SEGMENTS } from "src/services/state/uiState.store";
import { SELECT_REGIONS_WITH_ID } from "src/services/state/viewerState.store";

const getProxyUrl = (ngUrl) => `nifti://${BACKEND_URL}preview/file?fileUrl=${encodeURIComponent(ngUrl.replace(/^nifti:\/\//,''))}`
const getProxyOther = ({source}) => /AUTH_227176556f3c4bb38df9feea4b91200c/.test(source)
? {
  transform: [
    [
      1e6,
      0,
      0,
      0
    ],
    [
      0,
      1e6,
      0,
      0
    ],
    [
      0,
      0,
      1e6,
      0
    ],
    [
      0,
      0,
      0,
      1
    ]
  ]
}: {}
const isFirstRow = (cell: HTMLElement) => {
  const { parentElement:row } = cell
  const { parentElement:container } = row
  return container.firstElementChild === row
}

const isFirstCell = (cell:HTMLElement) => {
  const { parentElement:row } = cell
  return row.firstElementChild === cell
}

const scanFn : (acc:[boolean, boolean, boolean], curr: CustomEvent) => [boolean, boolean, boolean] = (acc, curr) => {

  const target = <HTMLElement>curr.target
  const targetIsFirstRow = isFirstRow(target)
  const targetIsFirstCell = isFirstCell(target)
  const idx = targetIsFirstRow
    ? targetIsFirstCell
      ? 0
      : 1
    : targetIsFirstCell
      ? 2
      : null

  const returnAcc = [...acc]
  const num1 = typeof curr.detail.missingChunks === 'number' ? curr.detail.missingChunks : 0
  const num2 = typeof curr.detail.missingImageChunks === 'number' ? curr.detail.missingImageChunks : 0
  returnAcc[idx] = Math.max(num1, num2) > 0
  return returnAcc as [boolean, boolean, boolean]
}

@Component({
  selector : 'ui-nehuba-container',
  templateUrl : './nehubaContainer.template.html',
  styleUrls : [
    `./nehubaContainer.style.css`
  ]
})

export class NehubaContainer implements OnInit, OnDestroy{

  @ViewChild('container',{read:ViewContainerRef}) container : ViewContainerRef
  @ViewChild('[pos00]',{read:ElementRef}) topleft : ElementRef
  @ViewChild('[pos01]',{read:ElementRef}) topright : ElementRef
  @ViewChild('[pos10]',{read:ElementRef}) bottomleft : ElementRef
  @ViewChild('[pos11]',{read:ElementRef}) bottomright : ElementRef

  private nehubaViewerFactory : ComponentFactory<NehubaViewerUnit>

  public viewerLoaded : boolean = false

  private viewerPerformanceConfig$: Observable<ViewerConfiguration>

  private sliceViewLoadingMain$: Observable<[boolean, boolean, boolean]>
  public sliceViewLoading0$: Observable<boolean>
  public sliceViewLoading1$: Observable<boolean>
  public sliceViewLoading2$: Observable<boolean>
  public perspectiveViewLoading$: Observable<string|null>

  private newViewer$ : Observable<any>
  private selectedParcellation$ : Observable<any>
  private selectedRegions$ : Observable<any[]>
  public selectedLandmarks$ : Observable<any[]>
  public selectedPtLandmarks$ : Observable<any[]>
  private hideSegmentations$ : Observable<boolean>

  private fetchedSpatialDatasets$ : Observable<Landmark[]>
  private userLandmarks$ : Observable<UserLandmark[]>
  public onHoverSegmentName$ : Observable<string>
  public onHoverSegment$ : Observable<any>
  private onHoverLandmark$ : Observable<any|null>

  private navigationChanges$ : Observable<any>
  public spatialResultsVisible$ : Observable<boolean>
  private spatialResultsVisible : boolean = false

  private selectedTemplate : any | null
  private selectedRegionIndexSet : Set<string> = new Set()
  public fetchedSpatialData : Landmark[] = []

  private ngLayersRegister : Partial<NgViewerStateInterface> = {layers : [], forceShowSegment: null}
  private ngLayers$ : Observable<NgViewerStateInterface>
  
  public selectedParcellation : any | null

  private cr : ComponentRef<NehubaViewerUnit>
  public nehubaViewer : NehubaViewerUnit
  private multiNgIdsRegionsLabelIndexMap: Map<string, Map<number, any>> = new Map()
  private landmarksLabelIndexMap : Map<number, any> = new Map()
  private landmarksNameMap : Map<string,number> = new Map()
  
  private userLandmarks : UserLandmark[] = []
  
  private subscriptions : Subscription[] = []
  private nehubaViewerSubscriptions : Subscription[] = []

  public nanometersToOffsetPixelsFn : Function[] = []
  private viewerConfig : Partial<ViewerConfiguration> = {}

  constructor(
    private constantService : AtlasViewerConstantsServices,
    private apiService :AtlasViewerAPIServices,
    private csf:ComponentFactoryResolver,
    private store : Store<ViewerStateInterface>,
    private elementRef : ElementRef
  ){
    this.viewerPerformanceConfig$ = this.store.pipe(
      select('viewerConfigState'),
      /**
       * TODO: this is only a bandaid fix. Technically, we should also implement
       * logic to take the previously set config to apply oninit
       */
      distinctUntilChanged(),
      debounceTime(200),
      tap(viewerConfig => this.viewerConfig = viewerConfig ),
      filter(() => isDefined(this.nehubaViewer) && isDefined(this.nehubaViewer.nehubaViewer))
    )

    this.nehubaViewerFactory = this.csf.resolveComponentFactory(NehubaViewerUnit)

    this.newViewer$ = this.store.pipe(
      select('viewerState'),
      filter(state=>isDefined(state) && isDefined(state.templateSelected)),
      filter(state=>
        !isDefined(this.selectedTemplate) || 
        state.templateSelected.name !== this.selectedTemplate.name)
    )

    this.selectedParcellation$ = this.store.pipe(
      select('viewerState'),
      safeFilter('parcellationSelected'),
      map(state=>state.parcellationSelected),
      distinctUntilChanged()
    )

    this.selectedRegions$ = this.store.pipe(
      select('viewerState'),
      select('regionsSelected'),
      filter(rs => !!rs)
    )

    this.selectedLandmarks$ = this.store.pipe(
      select('viewerState'),
      safeFilter('landmarksSelected'),
      map(state => state.landmarksSelected)
    )

    this.selectedPtLandmarks$ = this.selectedLandmarks$.pipe(
      map(lms => lms.filter(lm => lm.geometry.type === 'point'))
    )

    this.fetchedSpatialDatasets$ = this.store.pipe(
      select('dataStore'),
      safeFilter('fetchedSpatialData'),
      map(state => state.fetchedSpatialData),
      distinctUntilChanged(this.constantService.testLandmarksChanged),
      debounceTime(300),
    )

    this.navigationChanges$ = this.store.pipe(
      select('viewerState'),
      safeFilter('navigation'),
      map(state=>state.navigation)
    )

    this.spatialResultsVisible$ = this.store.pipe(
      select('spatialSearchState'),
      map(state=> isDefined(state) ?
        isDefined(state.spatialDataVisible) ?
          state.spatialDataVisible :
          true :
        true),
      distinctUntilChanged()
    )

    this.userLandmarks$ = this.store.pipe(
      /* TODO: distinct until changed */
      select('viewerState'),
      // filter(state => isDefined(state) && isDefined(state.userLandmarks)),
      map(state => isDefined(state) && isDefined(state.userLandmarks)
        ? state.userLandmarks
        : []),
      distinctUntilChanged(userLmUnchanged)
    )

    const segmentsUnchangedChanged = (s1,s2)=>
      !(typeof s1 === typeof s2 ?
        typeof s2 === 'undefined' ?
          false :
          typeof s2 === 'number' ?
            s2 !== s1 :
            s1 === s2 ?
              false :
              s1 === null || s2 === null ?
                true :
                s2.name !== s1.name :
        true)
    

    this.onHoverSegment$ = this.store.pipe(
      select('uiState'),
      filter(state=>isDefined(state)),
      map(state=>state.mouseOverSegment),
      distinctUntilChanged(segmentsUnchangedChanged)
    )

    this.onHoverLandmark$ = this.store.pipe(
      select('uiState'),
      filter(state => isDefined(state)),
      map(state => state.mouseOverLandmark)
    )

    // TODO hack, even though octant is hidden, it seems with VTK, one can highlight
    this.onHoverSegmentName$ = combineLatest(
      this.store.pipe(
        select('uiState'),
        filter(state=>isDefined(state)),
        map(state=>state.mouseOverSegment ?
          state.mouseOverSegment.constructor === Number ? 
            state.mouseOverSegment.toString() : 
            state.mouseOverSegment.name :
          '' ),
        distinctUntilChanged()
      ),
      this.onHoverLandmark$
    ).pipe(
      map(results => results[1] === null ? results[0] : '')
    )
    
    /* each time a new viewer is initialised, take the first event to get the translation function */
    this.newViewer$.pipe(
      // switchMap(() => fromEvent(this.elementRef.nativeElement, 'sliceRenderEvent')
      //   .pipe(
      //     ...takeOnePipe
      //   )
      // )

      switchMap(() => pipeFromArray([...takeOnePipe])(fromEvent(this.elementRef.nativeElement, 'sliceRenderEvent')))


    ).subscribe((events)=>{
      [0,1,2].forEach(idx=>this.nanometersToOffsetPixelsFn[idx] = (events[idx] as any).detail.nanometersToOffsetPixels)
    })

    this.sliceViewLoadingMain$ = fromEvent(this.elementRef.nativeElement, 'sliceRenderEvent').pipe(
      scan(scanFn, [null, null, null]),
    )

    this.sliceViewLoading0$ = this.sliceViewLoadingMain$
      .pipe(
        map(arr => arr[0])
      )

    this.sliceViewLoading1$ = this.sliceViewLoadingMain$
      .pipe(
        map(arr => arr[1])
      )

    this.sliceViewLoading2$ = this.sliceViewLoadingMain$
      .pipe(
        map(arr => arr[2])
      )

    /* missing chunk perspective view */
    this.perspectiveViewLoading$ = fromEvent(this.elementRef.nativeElement, 'perpspectiveRenderEvent')
      .pipe(
        filter(event => isDefined(event) && isDefined((event as any).detail) && isDefined((event as any).detail.lastLoadedMeshId) ),
        map(event => {

          const e = (event as any)
          const lastLoadedIdString = e.detail.lastLoadedMeshId.split(',')[0]
          const lastLoadedIdNum = Number(lastLoadedIdString)
          /**
           * TODO dig into event detail to see if the exact mesh loaded
           */
          return e.detail.meshesLoaded >= this.nehubaViewer.numMeshesToBeLoaded
            ? null
            : isNaN(lastLoadedIdNum)
              ? 'Loading unknown chunk'
              : lastLoadedIdNum >= 65500
                ? 'Loading auxiliary chunk'
                // : this.regionsLabelIndexMap.get(lastLoadedIdNum)
                //   ? `Loading ${this.regionsLabelIndexMap.get(lastLoadedIdNum).name}`
                  : 'Loading meshes ...'
        })
      )

    this.ngLayers$ = this.store.pipe(
      select('ngViewerState')
    )

    this.hideSegmentations$ = this.ngLayers$.pipe(
      map(state => isDefined(state)
        ? state.layers.findIndex(l => l.mixability === 'nonmixable') >= 0
        : false)
    )
  }

  get isMobile(){
    return this.constantService.mobile
  }

  ngOnInit(){

    this.subscriptions.push(
      this.viewerPerformanceConfig$.subscribe(config => {
        this.nehubaViewer.applyPerformanceConfig(config)
      })
    )

    this.subscriptions.push(
      this.fetchedSpatialDatasets$.subscribe(datasets => {
        this.landmarksLabelIndexMap = new Map(datasets.map((v,idx) => [idx, v]) as [number, any][])
        this.landmarksNameMap = new Map(datasets.map((v,idx) => [v.name, idx] as [string, number]))
      })
    )

    this.subscriptions.push(
      combineLatest(
        this.fetchedSpatialDatasets$,
        this.spatialResultsVisible$
      ).subscribe(([fetchedSpatialData,visible])=>{
        this.fetchedSpatialData = fetchedSpatialData

        if(visible && this.fetchedSpatialData && this.fetchedSpatialData.length > 0){
          this.nehubaViewer.addSpatialSearch3DLandmarks(
            this.fetchedSpatialData
              .map(data=> data.geometry.type === 'point'
                ? (data.geometry as PointLandmarkGeometry).position
                : data.geometry.type === 'plane'
                  ? [
                      (data.geometry as PlaneLandmarkGeometry).corners,
                      [[0,1,2], [0,2,3]]
                    ] 
                  : data.geometry.type === 'mesh'
                    ? [
                        (data.geometry as OtherLandmarkGeometry).vertices,
                        (data.geometry as OtherLandmarkGeometry).meshIdx
                      ]
                    : null)
            )
        }else{
          if (this.nehubaViewer && this.nehubaViewer.removeSpatialSearch3DLandmarks instanceof Function)
            this.nehubaViewer.removeSpatialSearch3DLandmarks()
        }
      })
    )

    this.subscriptions.push(
      this.userLandmarks$.pipe(
        // distinctUntilChanged((old,new) => )
      ).subscribe(landmarks => {
        this.userLandmarks = landmarks
        if(this.nehubaViewer){
          this.nehubaViewer.updateUserLandmarks(landmarks)
        }
      })
    )
    
    this.subscriptions.push(
      this.spatialResultsVisible$.subscribe(visible => this.spatialResultsVisible = visible)
    )

    this.subscriptions.push(
      this.newViewer$.pipe(
        skip(1)
      ).subscribe(() => {

        /* on selecting of new template, remove additional nglayers */
        const baseLayerNames = Object.keys(this.selectedTemplate.nehubaConfig.dataset.initialNgState.layers)
        this.ngLayersRegister.layers
          .filter(layer => baseLayerNames.findIndex(l => l === layer.name) < 0)
          .map(l => l.name)
          .forEach(layerName => {
            this.store.dispatch({
              type : REMOVE_NG_LAYER,
              layer : {
                name : layerName
              }
            })
          })
      })
    )

    /* order of subscription will determine the order of execution */
    this.subscriptions.push(
      this.newViewer$.pipe(
        map(state => {
          const deepCopiedState = JSON.parse(JSON.stringify(state))
          const navigation = deepCopiedState.templateSelected.nehubaConfig.dataset.initialNgState.navigation
          if (!navigation) {
            return deepCopiedState
          }
          navigation.zoomFactor = calculateSliceZoomFactor(navigation.zoomFactor)
          deepCopiedState.templateSelected.nehubaConfig.dataset.initialNgState.navigation = navigation
          return deepCopiedState
        })
      ).subscribe((state)=>{
        this.store.dispatch({
          type: NEHUBA_READY,
          nehubaReady: false
        })
        this.nehubaViewerSubscriptions.forEach(s=>s.unsubscribe())

        this.selectedTemplate = state.templateSelected
        this.createNewNehuba(state.templateSelected)
        const foundParcellation = state.templateSelected.parcellations.find(parcellation=>
          state.parcellationSelected.name === parcellation.name)
        this.handleParcellation(foundParcellation ? foundParcellation : state.templateSelected.parcellations[0])

        const nehubaConfig = state.templateSelected.nehubaConfig
        const initialSpec = nehubaConfig.dataset.initialNgState
        const {layers} = initialSpec
        
        const dispatchLayers = Object.keys(layers).map(key => {
          const layer = {
            name : key,
            source : layers[key].source,
            mixability : layers[key].type === 'image'
              ? 'base'
              : 'mixable',
            visible : typeof layers[key].visible === 'undefined'
              ? true
              : layers[key].visible,
            transform : typeof layers[key].transform === 'undefined'
              ? null
              : layers[key].transform
          }
          this.ngLayersRegister.layers.push(layer)
          return layer
        })

        this.store.dispatch({
          type : ADD_NG_LAYER,
          layer : dispatchLayers
        })
      })
    )

    this.subscriptions.push(
      this.selectedParcellation$.subscribe((this.handleParcellation).bind(this))
    )

    this.subscriptions.push(

      combineLatest(
        this.selectedRegions$.pipe(
          distinctUntilChanged()
        ),
        this.hideSegmentations$.pipe(
          distinctUntilChanged()
        ),
        this.ngLayers$.pipe(
          map(state => state.forceShowSegment)
        )
      )
        .subscribe(([regions,hideSegmentFlag,forceShowSegment])=>{
          if(!this.nehubaViewer) return

          /* selectedregionindexset needs to be updated regardless of forceshowsegment */
          this.selectedRegionIndexSet = new Set(regions.map(({ngId, labelIndex})=>generateLabelIndexId({ ngId, labelIndex })))

          if( forceShowSegment === false || (forceShowSegment === null && hideSegmentFlag) ){
            this.nehubaViewer.hideAllSeg()
            return
          }

          this.selectedRegionIndexSet.size > 0 ?
            this.nehubaViewer.showSegs([...this.selectedRegionIndexSet]) :
            this.nehubaViewer.showAllSeg()
          }
        )
    )


    this.subscriptions.push(
      this.ngLayers$.subscribe(ngLayersInterface => {
        if(!this.nehubaViewer) return

        const newLayers = ngLayersInterface.layers.filter(l => this.ngLayersRegister.layers.findIndex(ol => ol.name === l.name) < 0)
        const removeLayers = this.ngLayersRegister.layers.filter(l => ngLayersInterface.layers.findIndex(nl => nl.name === l.name) < 0)
        
        if(newLayers.length > 0){
          const newLayersObj:any = {}
          newLayers.forEach(({ name, source, ...rest }) => newLayersObj[name] = {
            ...rest,
            source
            // source: getProxyUrl(source),
            // ...getProxyOther({source})
          })

          if(!this.nehubaViewer.nehubaViewer || !this.nehubaViewer.nehubaViewer.ngviewer){
            this.nehubaViewer.initNiftiLayers.push(newLayersObj)
          }else{
            this.nehubaViewer.loadLayer(newLayersObj)
          }
          this.ngLayersRegister.layers = this.ngLayersRegister.layers.concat(newLayers)
        }

        if(removeLayers.length > 0){
          removeLayers.forEach(l => {
            if(this.nehubaViewer.removeLayer({
              name : l.name
            }))
            this.ngLayersRegister.layers = this.ngLayersRegister.layers.filter(rl => rl.name !== l.name)
          })
        }
      })
    )

    /* setup init view state */
    combineLatest(
      this.navigationChanges$,
      this.selectedRegions$,
    ).subscribe(([navigation,regions])=>{
      this.nehubaViewer.initNav = 
        Object.assign({},navigation,{
          positionReal : true
        })
      this.nehubaViewer.initRegions = regions.map(({ ngId, labelIndex }) =>generateLabelIndexId({ ngId, labelIndex }))
    })

    this.subscriptions.push(
      this.navigationChanges$.subscribe(this.handleDispatchedNavigationChange.bind(this))
    )

    /* handler to open/select landmark */
    const clickObs$ = fromEvent(this.elementRef.nativeElement, 'click').pipe(
        withLatestFrom(this.onHoverLandmark$),
        filter(results => results[1] !== null),
        map(results => results[1]),
        withLatestFrom(
          this.store.pipe(
            select('dataStore'),
            safeFilter('fetchedSpatialData'),
            map(state => state.fetchedSpatialData)
          )
        )
      )

    this.subscriptions.push(
      clickObs$.pipe(
        buffer(
          clickObs$.pipe(
            debounceTime(200)
          )
        ),
        filter(arr => arr.length >= 2),
        map(arr => [...arr].reverse()[0]),
        withLatestFrom(this.selectedLandmarks$)
      )
        .subscribe(([clickObs, selectedSpatialDatas]) => {
          const [landmark, spatialDatas] = clickObs
          const idx = Number(landmark.replace('label=',''))
          if(isNaN(idx)){
            console.warn(`Landmark index could not be parsed as a number: ${landmark}`)
            return
          }

          const newSelectedSpatialDatas = selectedSpatialDatas.findIndex(data => data.name === spatialDatas[idx].name) >= 0
            ? selectedSpatialDatas.filter(v => v.name !== spatialDatas[idx].name)
            : selectedSpatialDatas.concat(Object.assign({}, spatialDatas[idx], {_label: landmark}) )
          
          this.store.dispatch({
            type : SELECT_LANDMARKS,
            landmarks : newSelectedSpatialDatas
          })
          // if(this.datasetViewerRegistry.has(spatialDatas[idx].name)){
          //   return
          // }
          // this.datasetViewerRegistry.add(spatialDatas[idx].name)
          // const comp = this.datasetViewerFactory.create(this.injector)
          // comp.instance.dataset = spatialDatas[idx]
          // comp.onDestroy(() => this.datasetViewerRegistry.delete(spatialDatas[idx].name))
          // this.widgetServices.addNewWidget(comp, {
          //   exitable : true,
          //   persistency : false,
          //   state : 'floating',
          //   title : `Spatial Dataset - ${spatialDatas[idx].name}`
          // })
        })
    )

    this.subscriptions.push(
      this.selectedLandmarks$.pipe(
        map(lms => lms.map(lm => this.landmarksNameMap.get(lm.name)))
      ).subscribe(indices => {
        const filteredIndices = indices.filter(v => typeof v !== 'undefined' && v !== null)
        if(this.nehubaViewer)
          this.nehubaViewer.spatialLandmarkSelectionChanged(filteredIndices)
      })
    )
  }

  // datasetViewerRegistry : Set<string> = new Set()
  public showObliqueScreen$ : Observable<boolean>
  public showObliqueSelection$ : Observable<boolean>
  public showObliqueRotate$ : Observable<boolean>

  ngAfterViewInit(){
  }

  ngOnDestroy(){
    this.subscriptions.forEach(s=>s.unsubscribe())
  }

  public tunableMobileProperties = ['Oblique Rotate X', 'Oblique Rotate Y', 'Oblique Rotate Z']
  public selectedProp = null

  handleMobileOverlayEvent(obj:any){
    const {delta, selectedProp} = obj
    this.selectedProp = selectedProp

    const idx = this.tunableMobileProperties.findIndex(p => p === selectedProp)
    idx === 0
      ? this.nehubaViewer.obliqueRotateX(delta)
      : idx === 1
        ? this.nehubaViewer.obliqueRotateY(delta)
        : idx === 2
          ? this.nehubaViewer.obliqueRotateZ(delta)
          : console.warn('could not oblique rotate')
  }

  returnTruePos(quadrant:number,data:any){
    const pos = quadrant > 2 ?
      [0,0,0] :
      this.nanometersToOffsetPixelsFn && this.nanometersToOffsetPixelsFn[quadrant] ?
        this.nanometersToOffsetPixelsFn[quadrant](data.geometry.position.map(n=>n*1e6)) :
        [0,0,0]
    return pos
  }

  getPositionX(quadrant:number,data:any){
    return this.returnTruePos(quadrant,data)[0]
  }
  getPositionY(quadrant:number,data:any){
    return this.returnTruePos(quadrant,data)[1]
  }
  getPositionZ(quadrant:number,data:any){
    return this.returnTruePos(quadrant,data)[2]
  }

  handleMouseEnterLandmark(spatialData:any){
    spatialData.highlight = true
    this.store.dispatch({
      type : MOUSE_OVER_LANDMARK,
      landmark : spatialData._label
    })
  }

  handleMouseLeaveLandmark(spatialData:any){
    spatialData.highlight = false
    this.store.dispatch({
      type :MOUSE_OVER_LANDMARK,
      landmark : null
    })
  }

  private handleParcellation(parcellation:any){
    /**
     * parcellaiton may be undefined
     */
    if ( !(parcellation && parcellation.regions)) {
      return
    }

    /**
     * first, get all all the ngIds, including parent id from parcellation (if defined)
     */
    const ngIds = getNgIds(parcellation.regions).concat( parcellation.ngId ? parcellation.ngId : [])

    this.multiNgIdsRegionsLabelIndexMap = getMultiNgIdsRegionsLabelIndexMap(parcellation)

    this.nehubaViewer.multiNgIdsLabelIndexMap = this.multiNgIdsRegionsLabelIndexMap

    /* TODO replace with proper KG id */
    /**
     * need to set unique array of ngIds, or else workers will be overworked
     */
    this.nehubaViewer.ngIds = Array.from(new Set(ngIds))
    this.selectedParcellation = parcellation
  }

  /* related spatial search */
  oldNavigation : any = {}
  spatialSearchPagination : number = 0

  private createNewNehuba(template:any){

    /**
     * TODO if plugin subscribes to viewerHandle, and then new template is selected, changes willl not be be sent
     * could be considered as a bug. 
     */
    this.apiService.interactiveViewer.viewerHandle = null

    this.viewerLoaded = true
    if( this.cr )
      this.cr.destroy()
    this.container.clear()
    this.cr = this.container.createComponent(this.nehubaViewerFactory)
    this.nehubaViewer = this.cr.instance

    /**
     * apply viewer config such as gpu limit
     */
    const { gpuLimit = null } = this.viewerConfig
    const { nehubaConfig } = template
    
    if (gpuLimit) {
      const initialNgState = nehubaConfig && nehubaConfig.dataset && nehubaConfig.dataset.initialNgState
      initialNgState['gpuLimit'] = gpuLimit
    }
    
    this.nehubaViewer.config = nehubaConfig

    /* TODO replace with id from KG */
    this.nehubaViewer.templateId = template.name

    this.nehubaViewerSubscriptions.push(
      this.nehubaViewer.debouncedViewerPositionChange.subscribe(this.handleEmittedNavigationChange.bind(this))
    )

    this.nehubaViewerSubscriptions.push(
      /**
       * TODO when user selects new template, window.viewer 
       */
      this.nehubaViewer.nehubaReady.subscribe(() => {
        this.store.dispatch({
          type: NEHUBA_READY,
          nehubaReady: true
        })
      })
    )

    this.nehubaViewerSubscriptions.push(
      this.nehubaViewer.debouncedViewerPositionChange.pipe(
        distinctUntilChanged((a,b) => 
          [0,1,2].every(idx => a.position[idx] === b.position[idx]) && a.zoom === b.zoom)
      ).subscribe(this.handleNavigationPositionAndNavigationZoomChange.bind(this))
    )

    const accumulatorFn: (
      acc:Map<string, { segment: string | null, segmentId: number | null }>,
      arg: {layer: {name: string}, segmentId: number|null, segment: string | null}
    ) => Map<string, {segment: string | null, segmentId: number|null}>
    = (acc, arg) => {
      const { layer, segment, segmentId } = arg
      const { name } = layer
      const newMap = new Map(acc)
      newMap.set(name, {segment, segmentId})
      return newMap
    }

    this.nehubaViewerSubscriptions.push(
      
      this.nehubaViewer.mouseoverSegmentEmitter.pipe(
        scan(accumulatorFn, new Map()),
        map(map => Array.from(map.entries()).filter(([_ngId, { segmentId }]) => segmentId))
      ).subscribe(arrOfArr => {
        this.store.dispatch({
          type: MOUSE_OVER_SEGMENTS,
          segments: arrOfArr.map( ([ngId, {segment, segmentId}]) => {
            return {
              layer: {
                name: ngId,
              },
              segment: segment || `${ngId}#${segmentId}`
            }
          } )
        })
      })
    )

    this.nehubaViewerSubscriptions.push(
      this.nehubaViewer.mouseoverLandmarkEmitter.subscribe(label => {
        this.store.dispatch({
          type : MOUSE_OVER_LANDMARK,
          landmark : label
        })
      })
    )

    const onhoverSegments$ = this.store.pipe(
      select('uiState'),
      select('mouseOverSegments'),
      filter(v => !!v),
      distinctUntilChanged((o, n) => o.length === n.length && n.every(segment => o.find(oSegment => oSegment.layer.name === segment.layer.name && oSegment.segment === segment.segment) ) )
    )

    // TODO hack, even though octant is hidden, it seems with vtk one can mouse on hover
    this.nehubaViewerSubscriptions.push(
      this.nehubaViewer.regionSelectionEmitter.pipe(
        withLatestFrom(this.onHoverLandmark$),
        filter(results => results[1] === null),
        withLatestFrom(onhoverSegments$),
        map(results => results[1]),
        filter(arr => arr.length > 0),
        map(arr => {
          return arr.map(({ layer, segment }) => {
            const ngId = segment.ngId || layer.name
            const labelIndex = segment.labelIndex
            return generateLabelIndexId({ ngId, labelIndex })
          })
        })
      ).subscribe((ids:string[]) => {
        const deselectFlag = ids.some(id => this.selectedRegionIndexSet.has(id))

        const set = new Set(this.selectedRegionIndexSet)
        if (deselectFlag) {
          ids.forEach(id => set.delete(id))
        } else {
          ids.forEach(id => set.add(id))
        }
        this.store.dispatch({
          type: SELECT_REGIONS_WITH_ID,
          selectRegionIds: [...set]
        })
      })
    )

    this.setupViewerHandleApi()
  }

  private setupViewerHandleApi(){
    this.apiService.interactiveViewer.viewerHandle = {
      setNavigationLoc : (coord,realSpace?)=>this.nehubaViewer.setNavigationState({
        position : coord,
        positionReal : typeof realSpace !== 'undefined' ? realSpace : true
      }),
      /* TODO introduce animation */
      moveToNavigationLoc : (coord,realSpace?)=>this.nehubaViewer.setNavigationState({
        position : coord,
        positionReal : typeof realSpace !== 'undefined' ? realSpace : true
      }),
      setNavigationOri : (quat)=>this.nehubaViewer.setNavigationState({
        orientation : quat
      }),
      /* TODO introduce animation */
      moveToNavigationOri : (quat)=>this.nehubaViewer.setNavigationState({
        orientation : quat
      }),
      showSegment : (labelIndex) => {
        /**
         * TODO reenable with updated select_regions api
         */
        console.warn(`showSegment is temporarily disabled`)

        // if(!this.selectedRegionIndexSet.has(labelIndex)) 
        //   this.store.dispatch({
        //     type : SELECT_REGIONS,
        //     selectRegions :  [labelIndex, ...this.selectedRegionIndexSet]
        //   })
      },
      add3DLandmarks : landmarks => {
        // TODO check uniqueness of ID
        if(!landmarks.every(l => isDefined(l.id)))
          throw new Error('every landmarks needs to be identified with the id field')
        if(!landmarks.every(l=> isDefined(l.position)))
          throw new Error('every landmarks needs to have position defined')
        if(!landmarks.every(l => l.position.constructor === Array) || !landmarks.every(l => l.position.every(v => !isNaN(v))) || !landmarks.every(l => l.position.length == 3))
          throw new Error('position needs to be a length 3 tuple of numbers ')
        this.store.dispatch({
          type: USER_LANDMARKS,
          landmarks : landmarks
        })
      },
      remove3DLandmarks : ids => {
        this.store.dispatch({
          type : USER_LANDMARKS,
          landmarks : this.userLandmarks.filter(l => ids.findIndex(id => id === l.id) < 0)
        })
      },
      hideSegment : (labelIndex) => {
        /**
         * TODO reenable with updated select_regions api
         */
        console.warn(`hideSegment is temporarily disabled`)

        // if(this.selectedRegionIndexSet.has(labelIndex)){
        //   this.store.dispatch({
        //     type :SELECT_REGIONS,
        //     selectRegions : [...this.selectedRegionIndexSet].filter(num=>num!==labelIndex)
        //   })
        // }
      },
      showAllSegments : () => {
        const selectRegionIds = []
        this.multiNgIdsRegionsLabelIndexMap.forEach((map, ngId) => {
          Array.from(map.keys()).forEach(labelIndex => {
            selectRegionIds.push(generateLabelIndexId({ ngId, labelIndex }))
          })
        })
        this.store.dispatch({
          type : SELECT_REGIONS_WITH_ID,
          selectRegionIds 
        })
      },
      hideAllSegments : () => {
        this.store.dispatch({
          type : SELECT_REGIONS_WITH_ID,
          selectRegions : []
        })
      },
      segmentColourMap : new Map(),
      applyColourMap : (map)=>{
        /* TODO to be implemented */
      },
      loadLayer : (layerObj)=>this.nehubaViewer.loadLayer(layerObj),
      removeLayer : (condition)=>this.nehubaViewer.removeLayer(condition),
      setLayerVisibility : (condition,visible)=>this.nehubaViewer.setLayerVisibility(condition,visible),
      mouseEvent : merge(
        fromEvent(this.elementRef.nativeElement,'click').pipe(
          map((ev:MouseEvent)=>({eventName :'click',event:ev}))
        ),
        fromEvent(this.elementRef.nativeElement,'mousemove').pipe(
          map((ev:MouseEvent)=>({eventName :'mousemove',event:ev}))
        ),
        /**
         * neuroglancer prevents propagation, so use capture instead
         */
        Observable.create(observer => {
          this.elementRef.nativeElement.addEventListener('mousedown', event => observer.next({eventName: 'mousedown', event}), true)
        }) as Observable<{eventName: string, event: MouseEvent}>,
        fromEvent(this.elementRef.nativeElement,'mouseup').pipe(
          map((ev:MouseEvent)=>({eventName :'mouseup',event:ev}))
        ),
      ) ,
      mouseOverNehuba : this.onHoverSegment$,
      getNgHash : this.nehubaViewer.getNgHash
    }
  }

  handleNavigationPositionAndNavigationZoomChange(navigation){
    if(!navigation.position){
      return
    }

    const center = navigation.position.map(n=>n/1e6)
    const searchWidth = this.constantService.spatialWidth / 4 * navigation.zoom / 1e6
    const { selectedTemplate } = this
    // this.atlasViewerDataService.spatialSearch({
    //   center,
    //   searchWidth,
    //   selectedTemplate,
    //   pageNo : 0
    // })
  }

  /* because the navigation can be changed from two sources, 
    either dynamically (e.g. navigation panel in the UI or plugins etc) 
    or actively (via user interaction with the viewer) 
    or lastly, set on init
    
    This handler function is meant to handle anytime viewer's navigation changes from either sources */
  handleEmittedNavigationChange(navigation){

    /* If the navigation is changed dynamically, this.oldnavigation is set prior to the propagation of the navigation state to the viewer.
      As the viewer updates the dynamically changed navigation, it will emit the navigation state. 
      The emitted navigation state should be identical to this.oldnavigation */

    const navigationChangedActively : boolean = Object.keys(this.oldNavigation).length === 0 || !Object.keys(this.oldNavigation).every(key=>{
      return this.oldNavigation[key].constructor === Number || this.oldNavigation[key].constructor === Boolean ?
        this.oldNavigation[key] === navigation[key] :
        this.oldNavigation[key].every((_,idx)=>this.oldNavigation[key][idx] === navigation[key][idx])
    })

    /* if navigation is changed dynamically (ie not actively), the state would have been propagated to the store already. Hence return */
    if( !navigationChangedActively )
      return
    
    /* navigation changed actively (by user interaction with the viewer)
      probagate the changes to the store */

    this.store.dispatch({
      type : CHANGE_NAVIGATION,
      navigation 
    })
  }

  handleDispatchedNavigationChange(navigation){

    /* extract the animation object */
    const { animation, ..._navigation } = navigation

    /**
     * remove keys that are falsy
     */
    Object.keys(_navigation).forEach(key => (!_navigation[key]) && delete _navigation[key])
    
    if( animation ){
      /* animated */

      const gen = timedValues()
      const dest = Object.assign({},_navigation)
      /* this.oldNavigation is old */
      const delta = Object.assign({}, ...Object.keys(dest).filter(key=>key !== 'positionReal').map(key=>{
        const returnObj = {}
        returnObj[key] = typeof dest[key] === 'number' ?
          dest[key] - this.oldNavigation[key] :
          typeof dest[key] === 'object' ?
            dest[key].map((val,idx)=>val - this.oldNavigation[key][idx]) :
            true
        return returnObj
      }))

      const animate = ()=>{
        const next = gen.next()
        const d =  next.value
        
        this.nehubaViewer.setNavigationState(
          Object.assign({}, ...Object.keys(dest).filter(k=>k !== 'positionReal').map(key=>{
            const returnObj = {}
            returnObj[key] = typeof dest[key] === 'number' ?
              dest[key] - ( delta[key] * ( 1 - d ) ) :
              dest[key].map((val,idx)=>val - ( delta[key][idx] * ( 1 - d ) ) )
            return returnObj
          }),{
            positionReal : true
          })
        )

        if( !next.done ){
          requestAnimationFrame(()=>animate())
        }else{

          /* set this.oldnavigation to represent the state of the store */
          /* animation done, set this.oldNavigation */
          this.oldNavigation = Object.assign({},this.oldNavigation,dest)
        }
      }
      requestAnimationFrame(()=>animate())
    } else {
      /* not animated */

      /* set this.oldnavigation to represent the state of the store */
      /* since the emitted change of navigation state is debounced, we can safely set this.oldNavigation to the destination */
      this.oldNavigation = Object.assign({},this.oldNavigation,_navigation)

      this.nehubaViewer.setNavigationState(Object.assign({},_navigation,{
        positionReal : true
      }))
    }
  }

}

export const identifySrcElement = (element:HTMLElement) => {
  const elementIsFirstRow = isFirstRow(element)
  const elementIsFirstCell = isFirstCell(element)

  return elementIsFirstCell && elementIsFirstRow
    ? 0
    : !elementIsFirstCell && elementIsFirstRow
    ? 1
    : elementIsFirstCell && !elementIsFirstRow
      ? 2
      : !elementIsFirstCell && !elementIsFirstRow
        ? 3
        : 4
}

export const takeOnePipe = [
  scan((acc:Event[],event:Event)=>{
    const target = (event as Event).target as HTMLElement
    /**
     * 0 | 1
     * 2 | 3
     * 
     * 4 ???
     */
    const key = identifySrcElement(target)

    const _ = {}
    _[key] = event
    return Object.assign({},acc,_)
  },[]),
  filter(v=>{
    const isdefined = (obj) => typeof obj !== 'undefined' && obj !== null
    return (isdefined(v[0]) && isdefined(v[1]) && isdefined(v[2])) 
  }),
  take(1)
]

export const singleLmUnchanged = (lm:{id:string,position:[number,number,number]}, map: Map<string,[number,number,number]>) => 
  map.has(lm.id) && map.get(lm.id).every((value,idx) => value === lm.position[idx])

export const userLmUnchanged = (oldlms, newlms) => {
  const oldmap = new Map(oldlms.map(lm => [lm.id, lm.position]))
  const newmap = new Map(newlms.map(lm => [lm.id, lm.position]))

  return oldlms.every(lm => singleLmUnchanged(lm, newmap as Map<string,[number,number,number]>))
    && newlms.every(lm => singleLmUnchanged(lm, oldmap as Map<string, [number,number,number]>))
}

export const calculateSliceZoomFactor = (originalZoom) => originalZoom
  ? 700 * originalZoom / Math.min(window.innerHeight, window.innerWidth)
  : 1e7