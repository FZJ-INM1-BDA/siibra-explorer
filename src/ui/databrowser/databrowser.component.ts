import { Component, OnDestroy, ComponentFactoryResolver, ComponentFactory, OnInit, Injector } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { DataStateInterface, Property, safeFilter, DataEntry, File, SELECT_REGIONS, getLabelIndexMap, LOAD_DEDICATED_LAYER, UNLOAD_DEDICATED_LAYER, FETCHED_SPATIAL_DATA, isDefined, SPATIAL_GOTO_PAGE, CHANGE_NAVIGATION, UPDATE_SPATIAL_DATA_VISIBLE } from "../../services/stateStore.service";
import { map, filter, take, distinctUntilChanged } from "rxjs/operators";
import { HasPathProperty } from "../../util/pipes/pathToNestedChildren.pipe";
import { TreeComponent } from "../../components/tree/tree.component";
import { Observable, Subscription, merge } from "rxjs";
import { FileViewer } from "../fileviewer/fileviewer.component";
import { WidgetServices } from "../../atlasViewer/widgetUnit/widgetService.service";
import { AtlasViewerConstantsServices } from "../../atlasViewer/atlasViewer.constantService.service";
import { AtlasViewerDataService } from "../../atlasViewer/atlasViewer.dataService.service";

@Component({
  selector : 'data-browser',
  templateUrl : './databrowser.template.html',
  styleUrls : [
    `./databrowser.style.css`
  ]
})

export class DataBrowserUI implements OnDestroy,OnInit{

  private fileViewerComponentFactory : ComponentFactory<FileViewer>

  hitsPerPage : number = 15
  currentPage :  number = 0

  selectedRegions : any[] = []

  metadataMap : Map<string,Map<string,{properties:Property}>>
  dataEntries : DataEntry[] = []
  spatialDataEntries : DataEntry[] = []
  spatialPagination : number = 0
  spatialTotalNo : number = 0
  hideDataTypes : Set<string> = new Set()

  private _spatialDataVisible : boolean = false
  private spatialSearchObj : {center:[number,number,number],searchWidth:number,templateSpace : string,pageNo:number}

  dedicatedViewString : string | null

  private regionsLabelIndexMap : Map<number,any> = new Map()

  private regionSelected$ : Observable<any>
  private metadataMap$ : Observable<any>
  private fetchedDataEntries$ : Observable<any>
  private newViewer$ : Observable<any>
  private selectParcellation$ : Observable<any>
  private dedicatedViewString$ : Observable<string|null>
  private spatialDataEntries$ : Observable<any[]>
  private spatialPagination$ : Observable<{spatialSearchPagination:number,spatialSearchTotalResults:number}>
  private debouncedNavigation$ : Observable<any>

  private subscriptions : Subscription[] = []
  private selectedTemplate : any

  constructor(
    private cfr : ComponentFactoryResolver,
    private store : Store<DataStateInterface>,
    private atlasviewerDataService : AtlasViewerDataService,
    private constantService : AtlasViewerConstantsServices,
    private injector : Injector,
    private widgetServices : WidgetServices
  ){
    
    this.fileViewerComponentFactory = this.cfr.resolveComponentFactory(FileViewer)

    this.regionSelected$ = merge(
      this.store.pipe(
        select('viewerState'),
        filter(state=>isDefined(state)&&isDefined(state.regionsSelected)),
        map(state=>state.regionsSelected)
      )
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
      
    this.newViewer$ = this.store.pipe(
      select('viewerState'),
      filter(state=>isDefined(state) && isDefined(state.templateSelected)),
      filter(state=>
        !isDefined(this.selectedTemplate) || 
        state.templateSelected.name !== this.selectedTemplate.name) 
    )

    this.debouncedNavigation$ = this.store.pipe(
      select('viewerState'),
      filter(state=>isDefined(state) && isDefined(state.navigation)),
      map(state=>state.navigation)
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

    this.subscriptions.push(
      this.newViewer$.subscribe(state=>{
        this.selectedTemplate = state.templateSelected
        this.handleParcellationSelection(state.parcellationSelected.regions)
        this.store.dispatch({
          type : FETCHED_SPATIAL_DATA,
          fetchedDataEntries : []
        })
        this.store.dispatch({
          type : SPATIAL_GOTO_PAGE,
          pageNo : 0
        })
      })
    )

    this.subscriptions.push(
      this.debouncedNavigation$.subscribe(this.handleDebouncedNavigation.bind(this))
    )

    this.subscriptions.push(this.regionSelected$
      .subscribe(rs=>this.selectedRegions = rs))

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

  toggleSpatialDataVisible(){
    /* disabling spatial data for now */
    return
    //@ts-ignore
    this.store.dispatch({
      type : UPDATE_SPATIAL_DATA_VISIBLE,
      visible : !this._spatialDataVisible
    })
  }

  get spatialDataVisible(){
    return this._spatialDataVisible
  }

  handleSpatialPaginationChange(state){
    if(isDefined (state.spatialSearchPagination) )
      this.spatialPagination = state.spatialSearchPagination

    if(isDefined(state.spatialSearchTotalResults))
      this.spatialTotalNo = state.spatialSearchTotalResults
      
    if(isDefined(state.spatialDataVisible))
      this._spatialDataVisible = state.spatialDataVisible

    if(this._spatialDataVisible === false)
      return
    
    if(this.spatialPagination === this.spatialSearchObj.pageNo)
      return

    this.spatialSearchObj.pageNo = this.spatialPagination
    this.atlasviewerDataService.spatialSearch(this.spatialSearchObj)
  }

  handleDebouncedNavigation(navigation:any){
    if(!isDefined(navigation.position)||!this._spatialDataVisible)
      return
    const center = navigation.position.map(n=>n/1e6)
    const searchWidth = this.constantService.spatialWidth / 4 * navigation.zoom / 1e6
    const templateSpace = this.selectedTemplate.name
    const pageNo = this.spatialPagination

    this.spatialSearchObj = {
      center,
      searchWidth,
      templateSpace,
      pageNo
    }
    this.atlasviewerDataService.spatialSearch(this.spatialSearchObj)
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

  handleTreeNodeClick(obj:{inputItem:any,node:TreeComponent},searchResult:any){
    
    const { properties } = searchResult
    obj.node.childrenExpanded = !obj.node.childrenExpanded

    if(obj.inputItem.mimetype){
      if(this.dataWindowRegistry.has(obj.inputItem.name)){
        /* already open, will not open again */
        return 
      }
      /* not yet open, add the name to registry */
      this.dataWindowRegistry.add(obj.inputItem.name)

      const component = this.fileViewerComponentFactory.create(this.injector)
      component.instance.searchResultFile = Object.assign({}, obj.inputItem, { datasetProperties : properties })
      const compref = this.widgetServices.addNewWidget(component,{title:obj.inputItem.name,exitable:true,state:'floating'})

      /* on destroy, removes name from registry */
      compref.onDestroy(() => this.dataWindowRegistry.delete(obj.inputItem.name))
    }else{
      console.warn('the selected file has no mimetype defined')
    }
  }

  get databrowserHeaderText() : string{
    return this.selectedRegions.length === 0 ?
      `No regions selected.` :
      `${this.selectedRegions.length} region${this.selectedRegions.length > 1 ? 's' : ''} selected.`
  }

  clearAllRegions(){
    this.store.dispatch({
      type : SELECT_REGIONS,
      selectRegions : []
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

  regionSelected(region:any){
    const idx = this.selectedRegions.findIndex(re=>re.name===region.name)
    return idx >= 0
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

  removeRegion(event:MouseEvent,region:any){
    event.stopPropagation()
    event.preventDefault()

    this.store.dispatch({
      type : SELECT_REGIONS,
      selectRegions : this.selectedRegions.filter(re=>re.name!==region.name)
    })
  }
}
