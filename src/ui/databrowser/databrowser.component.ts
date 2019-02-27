import { Component, OnDestroy, ComponentFactoryResolver, ComponentFactory, OnInit, Injector } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { DataStateInterface, Property, safeFilter, DataEntry, File, SELECT_REGIONS, getLabelIndexMap, isDefined, SPATIAL_GOTO_PAGE, CHANGE_NAVIGATION, UPDATE_SPATIAL_DATA_VISIBLE, DESELECT_REGIONS, DESELECT_LANDMARKS, SELECT_LANDMARKS } from "../../services/stateStore.service";
import { map, filter, distinctUntilChanged } from "rxjs/operators";
import { HasPathProperty } from "../../util/pipes/pathToNestedChildren.pipe";
import { Observable, Subscription, combineLatest } from "rxjs";
import { FileViewer } from "../fileviewer/fileviewer.component";
import { WidgetServices } from "../../atlasViewer/widgetUnit/widgetService.service";
import { AtlasViewerConstantsServices } from "../../atlasViewer/atlasViewer.constantService.service";

@Component({
  selector : 'data-browser',
  templateUrl : './databrowser.template.html',
  styleUrls : [
    `./databrowser.style.css`
  ]
})

export class DataBrowserUI implements OnDestroy,OnInit{

  private fileViewerComponentFactory : ComponentFactory<FileViewer>

  hitsPerPage : number = 5
  currentPage :  number = 0

  metadataMap : Map<string,Map<string,{properties:Property}>>
  dataEntries : DataEntry[] = []
  spatialDataEntries : DataEntry[] = []
  spatialPagination : number = 0
  spatialTotalNo : number = 0
  hideDataTypes : Set<string> = new Set()

  private _spatialDataVisible : boolean = false

  dedicatedViewString : string | null

  private regionsLabelIndexMap : Map<number,any> = new Map()

  public selectedRegions$ : Observable<any[]>
  public selectedLandmarks$ : Observable<any[]>
  public selectedPOI$ : Observable<any[]>

  private metadataMap$ : Observable<any>
  public fetchedDataEntries$ : Observable<any>
  private selectParcellation$ : Observable<any>
  private dedicatedViewString$ : Observable<string|null>
  private spatialDataEntries$ : Observable<any[]>
  private spatialPagination$ : Observable<{spatialSearchPagination:number,spatialSearchTotalResults:number}>

  private subscriptions : Subscription[] = []

  get showDataTypes(){
    const availableDatatypes = new Set(this.dataEntries
      .map(de => de.formats)
      .reduce((acc, item) => acc.concat(item), [])
      .filter(type => !this.hideDataTypes.has(type)))
    return availableDatatypes
  }

  constructor(
    private cfr : ComponentFactoryResolver,
    private store : Store<DataStateInterface>,
    private constantService : AtlasViewerConstantsServices,
    private injector : Injector,
    private widgetServices : WidgetServices
  ){
    
    this.fileViewerComponentFactory = this.cfr.resolveComponentFactory(FileViewer)

    this.selectedRegions$ = this.store.pipe(
      select('viewerState'),
      safeFilter('regionsSelected'),
      map(state=>state.regionsSelected)
    )

    this.selectedLandmarks$ = this.store.pipe(
      select('viewerState'),
      safeFilter('landmarksSelected'),
      map(state => state.landmarksSelected)
    )

    this.selectedPOI$ = combineLatest(
      this.selectedRegions$,
      this.selectedLandmarks$
    ).pipe(
      map(results => [...results[0], ...results[1]])
    )
    

    this.metadataMap$ = this.store.pipe(
      select('dataStore'),
      safeFilter('fetchedMetadataMap'),
      map(v=>v.fetchedMetadataMap)
    )
    
    this.fetchedDataEntries$ = this.store.pipe(
      select('dataStore'),
      safeFilter('fetchedDataEntries'),
      map(v=>v.fetchedDataEntries)
    )

    this.selectParcellation$ = this.store.pipe(
      select('viewerState'),
      safeFilter('parcellationSelected'),
      map(state=>state.parcellationSelected),
      distinctUntilChanged((p1,p2)=>p1.name === p2.name)
    )
      

    this.dedicatedViewString$ = this.store.pipe(
      select('viewerState'),
      filter(state=> typeof state !== 'undefined' && state !== null),
      map(state=>state.dedicatedView)
    )

    this.spatialDataEntries$ = this.store.pipe(
      select('dataStore'),
      safeFilter('fetchedSpatialData'),
      map(state=>state.fetchedSpatialData)
    )

    this.spatialPagination$ = store.pipe(
      select('spatialSearchState'),
      filter(state=> isDefined(state) &&
        isDefined(state.spatialSearchPagination) &&
        isDefined(state.spatialSearchTotalResults)
      ),
      distinctUntilChanged((s1,s2)=>
        s1.spatialSearchPagination === s2.spatialSearchPagination &&
        s1.spatialSearchTotalResults === s2.spatialSearchTotalResults &&
        s1.spatialDataVisible === s2.spatialDataVisible),
    )
  }

  ngOnInit(){

    this.subscriptions.push(this.metadataMap$.subscribe(map=>(this.metadataMap = map)))

    this.subscriptions.push(this.fetchedDataEntries$.subscribe(arr=>(this.dataEntries = arr)))

    this.subscriptions.push(this.selectParcellation$.subscribe(parcellation=>
        this.handleParcellationSelection(parcellation.regions)))

    this.subscriptions.push(
      this.dedicatedViewString$.subscribe(dvs=>this.dedicatedViewString = dvs))

    this.subscriptions.push(
      this.spatialDataEntries$.subscribe(this.handleSpatialDataEntries.bind(this)))

    this.subscriptions.push(
      this.spatialPagination$.subscribe(this.handleSpatialPaginationChange.bind(this))
    )
  }

  ngOnDestroy(){
    this.subscriptions.forEach(s=>s.unsubscribe())
  }

  /* spatial search functionalities */

  spatialPaginationChange(pagenum:number){
    this.store.dispatch({
      type : SPATIAL_GOTO_PAGE,
      pageNo : pagenum
    })
  }

  get spatialPaginationHitsPerPage(){
    return this.constantService.spatialResultsPerPage
  }

  deselectRegion(region:any){
    this.store.dispatch({
      type: DESELECT_REGIONS,
      deselectRegions: [region]
    })
  }

  toggleSpatialDataVisible(){
    this.store.dispatch({
      type : UPDATE_SPATIAL_DATA_VISIBLE,
      visible : !this._spatialDataVisible
    })
  }

  get spatialDataVisible(){
    return this._spatialDataVisible
  }

  // TODO deprecated? rethink how to implement displaying of spatial landmarks
  handleSpatialPaginationChange(state){
    // if(isDefined (state.spatialSearchPagination) )
    //   this.spatialPagination = state.spatialSearchPagination

    if(isDefined(state.spatialSearchTotalResults))
      this.spatialTotalNo = state.spatialSearchTotalResults
      
    if(isDefined(state.spatialDataVisible))
      this._spatialDataVisible = state.spatialDataVisible

    // if(this._spatialDataVisible === false)
    //   return
    
    // if(this.spatialPagination === this.spatialSearchObj.pageNo)
    //   return

    // console.log('pagination change')
    // this.spatialSearchObj.pageNo = this.spatialPagination
    // this.atlasviewerDataService.spatialSearch(this.spatialSearchObj)
  }

  handleSpatialDataEntries(datas){
    this.spatialDataEntries = datas
  }

  /* non-spatial data functionalities */

  regions : any[] = []

  handleParcellationSelection(regions:any[]){
    this.regionsLabelIndexMap = getLabelIndexMap(regions)
    this.regions = Array.from(this.regionsLabelIndexMap.values())
  }

  paginationChange(pageNum:number){
    this.currentPage = pageNum
  }

  serchResultFilesIsArray(files:any){
    return typeof files !== 'undefined' && 
      files !== null &&
      files.constructor === Array
  }

  renderNode(file:HasPathProperty&File){
    return `${file.name ? file.name : file.path}`
  }

  dataWindowRegistry: Set<string> = new Set()

  handleFlatTreeNodeClick(payload:{dataset:DataEntry, file:File}){
    const { dataset, file } = payload
    if(dataset.formats.findIndex(format => format.toLowerCase() === 'nifti' ) >= 0){

      // TODO use KG id in future
      if(this.dataWindowRegistry.has(file.name)){
        /* already open, will not open again */
        return
      }
      /* not yet open, add the name to registry */
      this.dataWindowRegistry.add(file.name)

      const component = this.fileViewerComponentFactory.create(this.injector)
      component.instance.searchResultFile = file
      const compref = this.widgetServices.addNewWidget(component,{title:file.name,exitable:true,state:'floating'})

      /* on destroy, removes name from registry */
      compref.onDestroy(() => this.dataWindowRegistry.delete(file.name))
    }else{
      /** no mime type  */
    }
  }

  clearAllPOIs(){
    this.store.dispatch({
      type : SELECT_REGIONS,
      selectRegions : []
    })
    this.store.dispatch({
      type : SELECT_LANDMARKS,
      landmarks : []
    })
  }

  typeVisible(type:string){
    return !this.hideDataTypes.has(type)
  }

  toggleTypeVisibility(type:string){
    this.hideDataTypes.has(type) ?
      this.hideDataTypes.delete(type) :
      this.hideDataTypes.add(type)

    /* Somehow necessary, or else Angular will not mark for change */
    this.hideDataTypes = new Set(
      [...this.hideDataTypes]
    )
  }

  gothere(event:MouseEvent,position:any){
    event.stopPropagation()
    event.preventDefault()

    this.store.dispatch({
      type : CHANGE_NAVIGATION,
      navigation : {
        position : position,
        animation : {
          
        }
      }
    })
  }

  removePOI(event:MouseEvent, region:any){
    event.stopPropagation()
    event.preventDefault()

    if(region.spatialLandmark){
      this.store.dispatch({
        type : DESELECT_LANDMARKS,
        deselectLandmarks : [region]
      })
    }else{
      this.store.dispatch({
        type : DESELECT_REGIONS,
        deselectRegions : [region]
      })
    }
  }
}
