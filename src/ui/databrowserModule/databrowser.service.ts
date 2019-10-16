import { Injectable, OnDestroy } from "@angular/core";
import { Subscription, Observable, combineLatest, BehaviorSubject, fromEvent, from, of } from "rxjs";
import { ViewerConfiguration } from "src/services/state/viewerConfig.store";
import { select, Store } from "@ngrx/store";
import { AtlasViewerConstantsServices } from "src/atlasViewer/atlasViewer.constantService.service";
import { ADD_NG_LAYER, REMOVE_NG_LAYER, DataEntry, safeFilter, FETCHED_DATAENTRIES, FETCHED_SPATIAL_DATA, UPDATE_SPATIAL_DATA } from "src/services/stateStore.service";
import { map, distinctUntilChanged, debounceTime, filter, tap, switchMap, catchError, shareReplay, withLatestFrom } from "rxjs/operators";
import { AtlasWorkerService } from "src/atlasViewer/atlasViewer.workerService.service";
import { FilterDataEntriesByRegion } from "./util/filterDataEntriesByRegion.pipe";
import { NO_METHODS } from "./util/filterDataEntriesByMethods.pipe";
import { ComponentRef } from "@angular/core/src/render3";
import { DataBrowser } from "./databrowser/databrowser.component";
import { WidgetUnit } from "src/atlasViewer/widgetUnit/widgetUnit.component";
import { SHOW_KG_TOS } from "src/services/state/uiState.store";
import { regionFlattener } from "src/util/regionFlattener";
import { DATASETS_ACTIONS_TYPES } from "src/services/state/dataStore.store";
import { HttpClient } from "@angular/common/http";

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

  public kgTos$: Observable<any>
  public favedDataentries$: Observable<DataEntry[]>
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
      .then(de => this.filterDEByRegion.transform(de, regions, parcellation.regions.map(regionFlattener).reduce((acc, item) => acc.concat(item), [])))
      .then(resolve)
      .catch(reject)
  })

  private filterDEByRegion: FilterDataEntriesByRegion = new FilterDataEntriesByRegion()
  private dataentries: DataEntry[] = []

  private subscriptions: Subscription[] = []
  public fetchDataObservable$: Observable<any>
  public manualFetchDataset$: BehaviorSubject<null> = new BehaviorSubject(null)

  public spatialDatasets$: Observable<any>
  public viewportBoundingBox$: Observable<[Point, Point]>

  constructor(
    private workerService: AtlasWorkerService,
    private constantService: AtlasViewerConstantsServices,
    private store: Store<ViewerConfiguration>,
    private http: HttpClient
  ){

    this.kgTos$ = this.http.get(`${this.constantService.backendUrl}datasets/tos`, {
      responseType: 'text'
    }).pipe(
      catchError((err,obs) => {
        console.warn(`fetching kgTos error`, err)
        return of(null)
      }),
      shareReplay(1)
    )

    this.favedDataentries$ = this.store.pipe(
      select('dataStore'),
      select('favDataEntries'),
      shareReplay(1)
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

    this.viewportBoundingBox$ = this.store.pipe(
      select('viewerState'),
      select('navigation'),
      distinctUntilChanged(),
      debounceTime(SPATIAL_SEARCH_DEBOUNCE),
      filter(v => !!v && !!v.position && !!v.zoom),
      map(({ position, zoom }) => {

        // in mm
        const center = position.map(n=>n/1e6)
        const searchWidth = this.constantService.spatialWidth / 4 * zoom / 1e6
        const pt1 = center.map(v => (v - searchWidth)) as [number, number, number]
        const pt2 = center.map(v => (v + searchWidth)) as [number, number, number]

        return [pt1, pt2] as [Point, Point]
      })
    )

    this.spatialDatasets$ = this.viewportBoundingBox$.pipe(
      withLatestFrom(this.store.pipe(
        select('viewerState'),
        select('templateSelected'),
        distinctUntilChanged(),
        filter(v => !!v)
      )),
      switchMap(([ bbox, templateSelected ]) => {

        const _bbox = bbox.map(pt => pt.map(v => v.toFixed(SPATIAL_SEARCH_PRECISION)))
        /**
         * templateSelected and templateSelected.name must be defined for spatial search
         */
        if (!templateSelected || !templateSelected.name) return from(Promise.reject('templateSelected must not be empty'))
        const encodedTemplateName = encodeURIComponent(templateSelected.name)
        return this.http.get(`${this.constantService.backendUrl}datasets/spatialSearch/templateName/${encodedTemplateName}/bbox/${_bbox[0].join('_')}__${_bbox[1].join("_")}`).pipe(
          catchError((err) => (console.log(err), of([]))) 
        )
      }),
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

  public toggleFav(dataentry: DataEntry){
    this.store.dispatch({
      type: DATASETS_ACTIONS_TYPES.TOGGLE_FAV_DATASET,
      payload: dataentry
    })
  }

  public saveToFav(dataentry: DataEntry){
    this.store.dispatch({
      type: DATASETS_ACTIONS_TYPES.FAV_DATASET,
      payload: dataentry
    })
  }

  public removeFromFav(dataentry: DataEntry){
    this.store.dispatch({
      type: DATASETS_ACTIONS_TYPES.UNFAV_DATASET,
      payload: dataentry
    })
  }

  public fetchPreviewData(datasetName: string){
    const encodedDatasetName = encodeURIComponent(datasetName)
    return new Promise((resolve, reject) => {
      fetch(`${this.constantService.backendUrl}datasets/preview/${encodedDatasetName}`)
        .then(res => res.json())
        .then(resolve)
        .catch(reject)
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
    const encodedTemplateName = encodeURIComponent(templateName)
    const encodedParcellationName = encodeURIComponent(parcellationName)
    return Promise.all([
      fetch(`${this.constantService.backendUrl}datasets/templateName/${encodedTemplateName}`)
        .then(res => res.json()),
      fetch(`${this.constantService.backendUrl}datasets/parcellationName/${encodedParcellationName}`)
        .then(res => res.json())
    ])
      .then(arr => [...arr[0], ...arr[1]])
      /**
       * remove duplicates
       */
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

  rebuildRegionTree(selectedRegions, regions){
    this.workerService.worker.postMessage({
      type: 'BUILD_REGION_SELECTION_TREE',
      selectedRegions,
      regions
    })
  }

  public dbComponentInit(db:DataBrowser){
    this.store.dispatch({
      type: SHOW_KG_TOS
    })
  }

  public getModalityFromDE = getModalityFromDE
}


export function reduceDataentry(accumulator:{name:string, occurance:number}[], dataentry: DataEntry) {
  const methods = dataentry.methods
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

export function getIdFromDataEntry(dataentry: DataEntry){
  const { id, fullId } = dataentry
  const regex = /\/([a-zA-Z0-9\-]*?)$/.exec(fullId)
  return (regex && regex[1]) || id
}


export interface CountedDataModality{
  name: string
  occurance: number
  visible: boolean
}

type Point = [number, number, number]