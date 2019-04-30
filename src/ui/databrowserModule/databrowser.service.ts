import { Injectable, OnDestroy } from "@angular/core";
import { Subscription, Observable, combineLatest, BehaviorSubject, fromEvent, from, of } from "rxjs";
import { ViewerConfiguration } from "src/services/state/viewerConfig.store";
import { select, Store } from "@ngrx/store";
import { AtlasViewerConstantsServices } from "src/atlasViewer/atlasViewer.constantService.service";
import { ADD_NG_LAYER, REMOVE_NG_LAYER, DataEntry, safeFilter, FETCHED_DATAENTRIES, FETCHED_SPATIAL_DATA, UPDATE_SPATIAL_DATA } from "src/services/stateStore.service";
import { map, distinctUntilChanged, debounceTime, filter, tap, switchMap, catchError } from "rxjs/operators";
import { AtlasWorkerService } from "src/atlasViewer/atlasViewer.workerService.service";
import { FilterDataEntriesByRegion } from "./util/filterDataEntriesByRegion.pipe";
import { NO_METHODS } from "./util/filterDataEntriesByMethods.pipe";
import { ComponentRef } from "@angular/core/src/render3";
import { DataBrowser } from "./databrowser/databrowser.component";
import { WidgetUnit } from "src/atlasViewer/widgetUnit/widgetUnit.component";

const noMethodDisplayName = 'No methods described'

/**
 * param for .toFixed method
 * 6: nm
 * 3: um
 * 0: mm
 */
const SPATIAL_SEARCH_PRECISION = 6
/**
 * in ms
 */
const SPATIAL_SEARCH_DEBOUNCE = 500

export function temporaryFilterDataentryName(name: string):string{
  return /autoradiography/.test(name)
    ? 'autoradiography'
    : NO_METHODS === name
      ? noMethodDisplayName
      : name
}

function generateToken() {
  return Date.now().toString()
}

@Injectable({
  providedIn: 'root'
})
export class DatabrowserService implements OnDestroy{

  public darktheme: boolean = false

  public instantiatedWidgetUnits: WidgetUnit[] = []
  public queryData: (arg:{regions: any[], template:any, parcellation: any}) => void = (arg) => {
    const { dataBrowser, widgetUnit } = this.createDatabrowser(arg)
    this.instantiatedWidgetUnits.push(widgetUnit.instance)
    widgetUnit.onDestroy(() => {
      this.instantiatedWidgetUnits = this.instantiatedWidgetUnits.filter(db => db !== widgetUnit.instance)
    })
  }
  public createDatabrowser:  (arg:{regions:any[], template:any, parcellation:any}) => {dataBrowser: ComponentRef<DataBrowser>, widgetUnit:ComponentRef<WidgetUnit>}
  public getDataByRegion: ({regions, parcellation, template}:{regions:any[], parcellation:any, template: any}) => Promise<DataEntry[]> = ({regions, parcellation, template}) => new Promise((resolve, reject) => {
    this.lowLevelQuery(template.name, parcellation.name)
      .then(de => this.filterDEByRegion.transform(de, regions))
      .then(resolve)
      .catch(reject)
  })

  private filterDEByRegion: FilterDataEntriesByRegion = new FilterDataEntriesByRegion()
  private dataentries: DataEntry[] = []
  private fetchDataStatus$: Observable<any>

  private subscriptions: Subscription[] = []
  public fetchDataObservable$: Observable<any>
  public manualFetchDataset$: BehaviorSubject<null> = new BehaviorSubject(null)

  private fetchSpatialData$: Observable<any>
  public spatialDatasets$: Observable<any>

  constructor(
    private workerService: AtlasWorkerService,
    private constantService: AtlasViewerConstantsServices,
    private store: Store<ViewerConfiguration>
  ){

    this.subscriptions.push(
      this.store.pipe(
        select('ngViewerState')
      ).subscribe(layersInterface => 
        this.ngLayers = new Set(layersInterface.layers.map(l => l.source.replace(/^nifti\:\/\//, ''))))
    )

    this.subscriptions.push(
      store.pipe(
        select('dataStore'),
        safeFilter('fetchedDataEntries'),
        map(v => v.fetchedDataEntries)
      ).subscribe(de => {
        this.dataentries = de
      })
    )

  this.fetchSpatialData$ = combineLatest(
    this.store.pipe(
      select('viewerState'),
      select('navigation')
    ),
    this.store.pipe(
      select('viewerState'),
      select('templateSelected')
    )
  ).pipe(
    debounceTime(SPATIAL_SEARCH_DEBOUNCE)
  )

  this.spatialDatasets$ = this.fetchSpatialData$.pipe(
    filter(([navigation, templateSelected]) => !!navigation && !!navigation.position && !!templateSelected && !!templateSelected.name),
    switchMap(([navigation, templateSelected]) => {

        /**
       * templateSelected and templateSelected.name must be defined for spatial search
       */
      if (!templateSelected || !templateSelected.name)
        return from(Promise.reject('templateSelected must not be empty'))
      const encodedTemplateName = encodeURI(templateSelected.name)

      // in mm
      const center = navigation.position.map(n=>n/1e6)
      const searchWidth = this.constantService.spatialWidth / 4 * navigation.zoom / 1e6
      const pt1 = center.map(v => (v - searchWidth).toFixed(SPATIAL_SEARCH_PRECISION))
      const pt2 = center.map(v => (v + searchWidth).toFixed(SPATIAL_SEARCH_PRECISION))
      
      return from(fetch(`${this.constantService.backendUrl}datasets/spatialSearch/templateName/${encodedTemplateName}/bbox/${pt1.join('_')}__${pt2.join("_")}`)
        .then(res => res.json()))
    }),
    catchError((err) => (console.log(err), of([])))
  )

  this.fetchDataObservable$ = combineLatest(
      this.store.pipe(
        select('viewerState'),
        safeFilter('templateSelected'),
        tap(({templateSelected}) => this.darktheme = templateSelected.useTheme === 'dark'),
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

    this.fetchDataStatus$ = combineLatest(
      this.fetchDataObservable$
    )

    this.subscriptions.push(
      this.spatialDatasets$.subscribe(arr => {
        this.store.dispatch({
          type: FETCHED_SPATIAL_DATA,
          fetchedDataEntries: arr
        })
        this.store.dispatch({
          type : UPDATE_SPATIAL_DATA,
          totalResults : arr.length
        })
      })
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
        /**
         * apply filter and populate databrowser instances
         */
      })
    )
  }

  ngOnDestroy(){
    this.subscriptions.forEach(s => s.unsubscribe())
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

  private dispatchData(arr:DataEntry[]){
    this.store.dispatch({
      type : FETCHED_DATAENTRIES,
      fetchedDataEntries : arr
    })
  }

  public fetchedFlag: boolean = false
  public fetchError: string
  public fetchingFlag: boolean = false
  private mostRecentFetchToken: any

  private lowLevelQuery(templateName: string, parcellationName: string){
    const encodedTemplateName = encodeURI(templateName)
    const encodedParcellationName = encodeURI(parcellationName)
    return Promise.all([
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
      .then(map => Array.from(map.values() as DataEntry[]))
  }

  private fetchData(templateName: string, parcellationName: string){
    this.dispatchData([])

    const requestToken = generateToken()
    this.mostRecentFetchToken = requestToken
    this.fetchingFlag = true
    
    this.lowLevelQuery(templateName, parcellationName)
      .then(array => {
        if (this.mostRecentFetchToken === requestToken) {
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

  removeNgLayer({ url }) {
    this.store.dispatch({
      type : REMOVE_NG_LAYER,
      layer : {
        name : url
      }
    })
  }

  rebuildRegionTree(selectedRegions, regions){
    this.workerService.worker.postMessage({
      type: 'BUILD_REGION_SELECTION_TREE',
      selectedRegions,
      regions
    })
  }

  public getModalityFromDE = getModalityFromDE
}


export function reduceDataentry(accumulator:{name:string, occurance:number}[], dataentry: DataEntry) {
  const methods = dataentry.activity
    .map(a => a.methods)
    .reduce((acc, item) => acc.concat(
      item.length > 0
        ? item
        : NO_METHODS ), [])
    .map(temporaryFilterDataentryName)

  const newDE = Array.from(new Set(methods))
    .filter(m => !accumulator.some(a => a.name === m))

  return newDE.map(name => {
    return {
      name,
      occurance: 1
    }
  }).concat(accumulator.map(({name, occurance, ...rest}) => {
    return {
      ...rest,
      name,
      occurance: methods.some(m => m === name)
        ? occurance + 1
        : occurance
    }
  }))
}

export function getModalityFromDE(dataentries:DataEntry[]):CountedDataModality[] {
  return dataentries.reduce((acc, de) => reduceDataentry(acc, de), [])
}


export interface CountedDataModality{
  name: string
  occurance: number
  visible: boolean
}