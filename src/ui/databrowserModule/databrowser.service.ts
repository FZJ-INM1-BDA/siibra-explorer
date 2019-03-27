import { Injectable, ComponentRef, OnDestroy } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { ViewerConfiguration } from "src/services/state/viewerConfig.store";
import { SELECT_REGIONS, extractLabelIdx, CHANGE_NAVIGATION, DataEntry, File, safeFilter, isDefined, getLabelIndexMap, FETCHED_DATAENTRIES } from "src/services/stateStore.service";
import { WidgetServices } from "src/atlasViewer/widgetUnit/widgetService.service";
import { map, distinctUntilChanged, filter, debounceTime } from "rxjs/operators";
import { Subscription, combineLatest, Observable } from "rxjs";
import { AtlasViewerConstantsServices } from "src/atlasViewer/atlasViewer.constantService.service";

export function temporaryFilterDataentryName(name: string):string{
  return /autoradiography/.test(name)
    ? 'autoradiography'
    : name
}

@Injectable()
export class DatabrowserService implements OnDestroy{
  
  private subscriptions: Subscription[] = []

  public selectedParcellation: any
  public selectedRegions: any[] = []
  public regionsLabelIndexMap: Map<number, any> = new Map()

  public fetchedDataEntries$: Observable<DataEntry[]>

  constructor(
    private constantService: AtlasViewerConstantsServices,
    private store: Store<ViewerConfiguration>,
    private widgetService: WidgetServices
  ){
    /**
     * This service is provided on init. Angular does not provide 
     * lazy loading of module unless for routing
     */
    this.subscriptions.push(
      this.store.pipe(
        select('viewerState'),
        safeFilter('parcellationSelected'),
        map(state => state.parcellationSelected),
        distinctUntilChanged()
      ).subscribe(p => {
        this.selectedParcellation = p
        this.regionsLabelIndexMap = getLabelIndexMap(this.selectedParcellation.regions)
      })
    )

    this.fetchedDataEntries$ = store.pipe(
      select('dataStore'),
      safeFilter('fetchedDataEntries'),
      map(v => v.fetchedDataEntries)
    )

    this.subscriptions.push(
      this.store.pipe(
        select('viewerState'),
        filter(state => isDefined(state) && isDefined(state.regionsSelected)),
        map(state => state.regionsSelected)
      ).subscribe(r => this.selectedRegions = r)
    )

    this.subscriptions.push(
      combineLatest(
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
        )
      ).pipe(
        debounceTime(16)
      ).subscribe((param : [string, string] ) => this.fetchData(param[0], param[1]))
    )
  }

  ngOnDestroy(){
    console.log('destory')
    this.subscriptions.forEach(s => s.unsubscribe())
  }

  public updateRegionSelection(regions: any[]) {
    this.store.dispatch({
      type: SELECT_REGIONS,
      selectRegions: regions
    })
  }

  public singleClickRegion(region) {
    const selectedSet = new Set(extractLabelIdx(region))
    const intersection = new Set([...this.selectedRegions.map(r => r.labelIndex)].filter(v => selectedSet.has(v)))
    this.store.dispatch({
      type: SELECT_REGIONS,
      selectRegions: intersection.size > 0
        ? this.selectedRegions.filter(v => !intersection.has(v.labelIndex))
        : this.selectedRegions.concat([...selectedSet].map(idx => this.regionsLabelIndexMap.get(idx)))
    })
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
      .then(map => Array.from(map.values()))
      .then(this.dispatchData.bind(this))
      .catch(console.warn)
  }

  public temporaryFilterDataentryName = temporaryFilterDataentryName
}