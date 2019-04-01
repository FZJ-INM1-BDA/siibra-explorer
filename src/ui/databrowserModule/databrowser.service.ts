import { Injectable, ComponentRef, OnDestroy } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { ViewerConfiguration } from "src/services/state/viewerConfig.store";
import { SELECT_REGIONS, extractLabelIdx, CHANGE_NAVIGATION, DataEntry, File, safeFilter, isDefined, getLabelIndexMap, FETCHED_DATAENTRIES, SELECT_PARCELLATION, ADD_NG_LAYER, NgViewerStateInterface, REMOVE_NG_LAYER } from "src/services/stateStore.service";
import { WidgetServices } from "src/atlasViewer/widgetUnit/widgetService.service";
import { map, distinctUntilChanged, filter, debounceTime } from "rxjs/operators";
import { Subscription, combineLatest, Observable, BehaviorSubject, fromEvent } from "rxjs";
import { AtlasViewerConstantsServices } from "src/atlasViewer/atlasViewer.constantService.service";
import { AtlasWorkerService } from "src/atlasViewer/atlasViewer.workerService.service";

export function temporaryFilterDataentryName(name: string):string{
  return /autoradiography/.test(name)
    ? 'autoradiography'
    : name
}

function generateToken() {
  return Date.now().toString()
}

@Injectable()
export class DatabrowserService implements OnDestroy{
  
  private subscriptions: Subscription[] = []

  public selectedParcellation: any
  public selectedTemplate: any

  public selectedRegions$: Observable<any[]>
  public selectedRegions: any[] = []
  public rebuiltSelectedRegions: any[] = []
  public rebuiltSomeSelectedRegions: any[] = []

  public regionsLabelIndexMap: Map<number, any> = new Map()

  public fetchingFlag: boolean = false
  public fetchedFlag: boolean = false
  public fetchError: string
  private mostRecentFetchToken: any

  public fetchedDataEntries$: Observable<DataEntry[]>

  public fetchDataObservable$: Observable<any>
  public manualFetchDataset$: BehaviorSubject<null> = new BehaviorSubject(null)

  constructor(
    private constantService: AtlasViewerConstantsServices,
    private store: Store<ViewerConfiguration>,
    private widgetService: WidgetServices,
    private workerService: AtlasWorkerService
  ){

    this.subscriptions.push(
      this.store.pipe(
        select('ngViewerState')
      ).subscribe(layersInterface => 
        this.ngLayers = new Set(layersInterface.layers.map(l => l.source.replace(/^nifti\:\/\//, ''))))
    )

    this.selectedRegions$ = this.store.pipe(
      select('viewerState'),
      filter(state => isDefined(state) && isDefined(state.regionsSelected)),
      map(state => state.regionsSelected)
    )
    /**
     * This service is provided on init. Angular does not provide 
     * lazy loading of module unless for routing
     */
    this.subscriptions.push(
      this.store.pipe(
        select('viewerState'),
        safeFilter('parcellationSelected'),
        map(({ parcellationSelected, templateSelected }) => {
          return {
            parcellationSelected,
            templateSelected
          }
        }),
        distinctUntilChanged()
      ).subscribe(({ parcellationSelected, templateSelected }) => {
        this.selectedParcellation = parcellationSelected
        this.selectedTemplate = templateSelected
        this.regionsLabelIndexMap = getLabelIndexMap(this.selectedParcellation.regions)
      })
    )

    this.fetchedDataEntries$ = store.pipe(
      select('dataStore'),
      safeFilter('fetchedDataEntries'),
      map(v => v.fetchedDataEntries)
    )

    this.subscriptions.push(
      this.selectedRegions$.subscribe(r => {
        this.selectedRegions = r
        console.log(r)
        this.workerService.worker.postMessage({
          type: 'BUILD_REGION_SELECTION_TREE',
          selectedRegions: r,
          regions: this.selectedParcellation.regions
        })
      })
    )

    this.fetchDataObservable$ = combineLatest(
      this.store.pipe(
        select('viewerState'),
        safeFilter('templateSelected'),
        map(({templateSelected})=>(templateSelected.name)),
        distinctUntilChanged()
      ),
      this.store.pipe(
        select('viewerState'),
        safeFilter('parcellationSelected'),
        map(({parcellationSelected})=>(parcellationSelected.name)),
        distinctUntilChanged()
      ),
      this.manualFetchDataset$
    )

    this.subscriptions.push(
      this.fetchDataObservable$.pipe(
        debounceTime(16)
      ).subscribe((param : [string, string, null] ) => this.fetchData(param[0], param[1]))
    )

    this.subscriptions.push(
      fromEvent(this.workerService.worker, 'message').pipe(
        filter((message:MessageEvent) => message && message.data && message.data.type === 'RETURN_REBUILT_REGION_SELECTION_TREE'),
        map(message => message.data),
      ).subscribe((payload:any) => {
        /**
         * rebuiltSelectedRegion contains super region that are 
         * selected as a result of all of its children that are selectted
         */
        const { rebuiltSelectedRegions, rebuiltSomeSelectedRegions } = payload
        this.rebuiltSomeSelectedRegions = rebuiltSomeSelectedRegions
        this.rebuiltSelectedRegions = rebuiltSelectedRegions
      })
    )
  }

  ngOnDestroy(){
    this.subscriptions.forEach(s => s.unsubscribe())
  }
  
  public updateRegionSelection(regions: any[]) {
    const filteredRegion = regions.filter(r => r.labelIndex !== null && typeof r.labelIndex !== 'undefined')
    this.store.dispatch({
      type: SELECT_REGIONS,
      selectRegions: filteredRegion
    })
  }

  public deselectRegion(region) {
    const regionsToDelect = []
    const recursiveFlatten = (region:any) => {
      regionsToDelect.push(region)
      if (region.children && region.children.map)
        region.children.map(recursiveFlatten)
    }
    recursiveFlatten(region)
    const selectedRegions = this.selectedRegions.filter(r => !regionsToDelect.some(deR => deR.name === r.name))
    this.updateRegionSelection(selectedRegions)
  }

  public changeParcellation({ current, previous }){
    if (previous && current && current.name === previous.name)
      return
    this.store.dispatch({
      type: SELECT_PARCELLATION,
      selectParcellation: current
    })
  }

  public singleClickRegion(region) {
    const selectedSet = new Set(extractLabelIdx(region))
    const filteredSelectedRegion = this.selectedRegions.filter(r => r.labelIndex)
    const intersection = new Set([...filteredSelectedRegion.map(r => r.labelIndex)].filter(v => selectedSet.has(v)))
    this.updateRegionSelection(
      intersection.size > 0
        ? filteredSelectedRegion.filter(v => !intersection.has(v.labelIndex))
        : filteredSelectedRegion.concat([...selectedSet].map(idx => this.regionsLabelIndexMap.get(idx)))
    )
  }

  public doubleClickRegion(region) {
    if (!region.POIs && region.position)
      return
    
    const newPos = region.position || region.POIs && region.POIs.constructor === Array && region.POIs[0]

    this.store.dispatch({
      type: CHANGE_NAVIGATION,
      navigation: {
        position: newPos,
        animation: {
          /* empty object is enough to be truthy */
        }
      },
    })
  }

  public attachFileViewer(comp:ComponentRef<any>, file:File) {
    return this.widgetService.addNewWidget(comp, {
      title: file.name,
      exitable: true,
      state: 'floating'
    })
  }

  private dispatchData(arr:DataEntry[][]){
    this.store.dispatch({
      type : FETCHED_DATAENTRIES,
      fetchedDataEntries : arr.reduce((acc,curr)=>acc.concat(curr),[])
    })
  }

  private fetchData(templateName: string, parcellationName: string){
    this.dispatchData([])

    const requestToken = generateToken()
    this.mostRecentFetchToken = requestToken
    this.fetchingFlag = true
    
    const encodedTemplateName = encodeURI(templateName)
    const encodedParcellationName = encodeURI(parcellationName)
    /**
     * TODO instead of using promise.all, use stepwise fetching and
     * dispatching of dataentries
     */
    Promise.all([
      fetch(`${this.constantService.backendUrl}datasets/templateName/${encodedTemplateName}`)
        .then(res => res.json()),
      fetch(`${this.constantService.backendUrl}datasets/parcellationName/${encodedParcellationName}`)
        .then(res => res.json())
    ])
      .then(arr => [...arr[0], ...arr[1]])
      .then(arr => arr.reduce((acc, item) => {
        const newMap = new Map(acc)
        return newMap.set(item.name, item)
      }, new Map()))
      .then(map => {
        if (this.mostRecentFetchToken === requestToken) {
          const array = Array.from(map.values()) as DataEntry[][]
          this.dispatchData(array)
          this.mostRecentFetchToken = null
          this.fetchedFlag = true
          this.fetchingFlag = false
          this.fetchError = null
        }
      })
      .catch(e => {
        if (this.mostRecentFetchToken === requestToken) {
          this.fetchingFlag = false
          this.mostRecentFetchToken = null
          this.fetchError = 'Fetching dataset error.'
          console.warn('Error fetching dataset', e)
          /**
           * TODO
           * retry?
           */
        }
      })
  }

  public fetchPreviewData(datasetName: string){
    const encodedDatasetName = encodeURI(datasetName)
    return new Promise((resolve, reject) => {
      fetch(`${this.constantService.backendUrl}datasets/preview/${encodedDatasetName}`)
        .then(res => res.json())
        .then(resolve)
        .catch(reject)
    })
  }

  /**
   * dedicated viewing (nifti heat maps etc)
   */
  private niftiLayerName: string = `nifty layer`
  public ngLayers : Set<string> = new Set()
  public showNewNgLayer({ url }):void{

    const layer = {
      name : url,
      source : `nifti://${url}`,
      mixability : 'nonmixable',
      shader : this.constantService.getActiveColorMapFragmentMain()
    }
    this.store.dispatch({
      type: ADD_NG_LAYER,
      layer
    })
  }

  removeNgLayer({ url }) {
    this.store.dispatch({
      type : REMOVE_NG_LAYER,
      layer : {
        name : url
      }
    })
  }

  public temporaryFilterDataentryName = temporaryFilterDataentryName
}