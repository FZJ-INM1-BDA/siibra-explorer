import { HttpClient } from "@angular/common/http";
import {ComponentRef, Injectable, OnDestroy} from "@angular/core";
import { select, Store } from "@ngrx/store";
import { BehaviorSubject, combineLatest, forkJoin, from, fromEvent, Observable, of, Subscription } from "rxjs";
import { catchError, debounceTime, distinctUntilChanged, filter, map, shareReplay, switchMap, tap, withLatestFrom } from "rxjs/operators";
import { AtlasViewerConstantsServices } from "src/atlasViewer/atlasViewer.constantService.service";
import { AtlasWorkerService } from "src/atlasViewer/atlasViewer.workerService.service";

// TODO remove dependency on widget unit module
import { WidgetUnit } from "src/widget";

import { LoggingService } from "src/logging";
import { SHOW_KG_TOS } from "src/services/state/uiState.store";
import { FETCHED_DATAENTRIES, FETCHED_SPATIAL_DATA, IavRootStoreInterface, IDataEntry, safeFilter } from "src/services/stateStore.service";
import { DataBrowser } from "./databrowser/databrowser.component";
import { NO_METHODS } from "./util/filterDataEntriesByMethods.pipe";
import { FilterDataEntriesByRegion } from "./util/filterDataEntriesByRegion.pipe";
import { datastateActionToggleFav, datastateActionUnfavDataset, datastateActionFavDataset } from "src/services/state/dataState/actions";

import { getIdFromFullId } from 'common/util'
import { viewerStateSelectorNavigation } from "src/services/state/viewerState/selectors";

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

export function temporaryFilterDataentryName(name: string): string {
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
  providedIn: 'root',
})
export class DatabrowserService implements OnDestroy {

  public kgTos$: Observable<any>
  public favedDataentries$: Observable<Partial<IDataEntry>[]>
  public darktheme: boolean = false

  public instantiatedWidgetUnits: WidgetUnit[] = []
  public queryData: (arg: {regions: any[], template: any, parcellation: any}) => void = (arg) => {
    const { widgetUnit } = this.createDatabrowser(arg)
    this.instantiatedWidgetUnits.push(widgetUnit.instance)
    widgetUnit.onDestroy(() => {
      this.instantiatedWidgetUnits = this.instantiatedWidgetUnits.filter(db => db !== widgetUnit.instance)
    })
  }
  public createDatabrowser: (arg: {regions: any[], template: any, parcellation: any}) => {dataBrowser: ComponentRef<DataBrowser>, widgetUnit: ComponentRef<WidgetUnit>}
  public getDataByRegion: (arg: {regions: any[] }) => Observable<IDataEntry[]> = ({ regions }) => 
    forkJoin(regions.map(this.getDatasetsByRegion.bind(this))).pipe(
      map(
        (arrOfArr: IDataEntry[][]) => arrOfArr.reduce(
          (acc, curr) => {
            /**
             * In the event of multi region selection
             * It is entirely possibly that different regions can fetch the same dataset
             * If that's the case, filter by fullId attribute
             */
            const existSet = new Set(acc.map(v => v['fullId']))
            const filteredCurr = curr.filter(v => !existSet.has(v['fullId']))
            return acc.concat(filteredCurr)
          },
          []
        )
      )
    )

  private filterDEByRegion: FilterDataEntriesByRegion = new FilterDataEntriesByRegion()
  private dataentries: IDataEntry[] = []

  private subscriptions: Subscription[] = []
  public fetchDataObservable$: Observable<any>
  public manualFetchDataset$: BehaviorSubject<null> = new BehaviorSubject(null)

  public spatialDatasets$: Observable<any>
  public viewportBoundingBox$: Observable<[Point, Point]>

  constructor(
    private workerService: AtlasWorkerService,
    private constantService: AtlasViewerConstantsServices,
    private store: Store<IavRootStoreInterface>,
    private http: HttpClient,
    private log: LoggingService,
  ) {

    this.kgTos$ = this.http.get(`${this.constantService.backendUrl}datasets/tos`, {
      responseType: 'text',
    }).pipe(
      catchError((err, _obs) => {
        this.log.warn(`fetching kgTos error`, err)
        return of(null)
      }),
      shareReplay(1),
    )

    this.favedDataentries$ = this.store.pipe(
      select('dataStore'),
      select('favDataEntries'),
      shareReplay(1),
    )

    this.subscriptions.push(
      store.pipe(
        select('dataStore'),
        safeFilter('fetchedDataEntries'),
        map(v => v.fetchedDataEntries),
      ).subscribe(de => {
        this.dataentries = de
      }),
    )

    this.viewportBoundingBox$ = this.store.pipe(
      select(viewerStateSelectorNavigation),
      distinctUntilChanged(),
      debounceTime(SPATIAL_SEARCH_DEBOUNCE),
      filter(v => !!v && !!v.position && !!v.zoom),
      map(({ position, zoom }) => {

        // in mm
        const center = position.map(n => n / 1e6)
        const searchWidth = this.constantService.spatialWidth / 4 * zoom / 1e6
        const pt1 = center.map(v => (v - searchWidth)) as [number, number, number]
        const pt2 = center.map(v => (v + searchWidth)) as [number, number, number]

        return [pt1, pt2] as [Point, Point]
      }),
    )

    this.spatialDatasets$ = this.viewportBoundingBox$.pipe(
      withLatestFrom(this.store.pipe(
        select('viewerState'),
        select('templateSelected'),
        distinctUntilChanged(),
        filter(v => !!v),
      )),
      switchMap(([ bbox, templateSelected ]) => {

        const _bbox = bbox.map(pt => pt.map(v => v.toFixed(SPATIAL_SEARCH_PRECISION)))
        /**
         * templateSelected and templateSelected.name must be defined for spatial search
         */
        if (!templateSelected || !templateSelected.name) { return from(Promise.reject('templateSelected must not be empty')) }
        const encodedTemplateName = encodeURIComponent(templateSelected.name)
        return this.http.get(`${this.constantService.backendUrl}datasets/spatialSearch/templateName/${encodedTemplateName}/bbox/${_bbox[0].join('_')}__${_bbox[1].join("_")}`).pipe(
          catchError((err) => (this.log.log(err), of([]))),
        )
      }),
    )

    this.fetchDataObservable$ = combineLatest(
      this.store.pipe(
        select('viewerState'),
        safeFilter('templateSelected'),
        tap(({templateSelected}) => this.darktheme = templateSelected.useTheme === 'dark'),
        map(({templateSelected}) => (templateSelected.name)),
        distinctUntilChanged(),
      ),
      this.store.pipe(
        select('viewerState'),
        safeFilter('parcellationSelected'),
        map(({parcellationSelected}) => (parcellationSelected.name)),
        distinctUntilChanged(),
      ),
      this.manualFetchDataset$,
    )

    this.subscriptions.push(
      this.spatialDatasets$.subscribe(arr => {
        this.store.dispatch({
          type: FETCHED_SPATIAL_DATA,
          fetchedDataEntries: arr,
        })
      }),
    )

    this.subscriptions.push(
      this.fetchDataObservable$.pipe(
        debounceTime(16),
      ).subscribe((param: [string, string, null] ) => this.fetchData(param[0], param[1])),
    )

    this.subscriptions.push(
      fromEvent(this.workerService.worker, 'message').pipe(
        filter((message: MessageEvent) => message && message.data && message.data.type === 'RETURN_REBUILT_REGION_SELECTION_TREE'),
        map(message => message.data),
      ).subscribe((payload: any) => {
        /**
         * rebuiltSelectedRegion contains super region that are
         * selected as a result of all of its children that are selectted
         */
        const { rebuiltSelectedRegions, rebuiltSomeSelectedRegions } = payload
        /**
         * apply filter and populate databrowser instances
         */
      }),
    )
  }

  public ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe())
  }

  public toggleFav(dataentry: Partial<IDataEntry>) {
    this.store.dispatch(
      datastateActionToggleFav({
        payload: {
          fullId: dataentry.fullId || null
        }
      })
    )
  }

  public saveToFav(dataentry: Partial<IDataEntry>) {
    this.store.dispatch(
      datastateActionFavDataset({
        payload: {
          fullId: dataentry?.fullId || null
        }
      })
    )
  }

  public removeFromFav(dataentry: Partial<IDataEntry>) {
    this.store.dispatch(
      datastateActionUnfavDataset({
        payload: {
          fullId: dataentry.fullId || null
        }
      })
    )
  }

  // TODO deprecate
  public fetchPreviewData(datasetName: string) {
    const encodedDatasetName = encodeURIComponent(datasetName)
    return new Promise((resolve, reject) => {
      fetch(`${this.constantService.backendUrl}datasets/preview/${encodedDatasetName}`, this.constantService.getFetchOption())
        .then(res => res.json())
        .then(resolve)
        .catch(reject)
    })
  }

  private dispatchData(arr: IDataEntry[]) {
    this.store.dispatch({
      type : FETCHED_DATAENTRIES,
      fetchedDataEntries : arr,
    })
  }

  public fetchedFlag: boolean = false
  public fetchError: string
  public fetchingFlag: boolean = false
  private mostRecentFetchToken: any

  private memoizedDatasetByRegion = new Map<string, Observable<IDataEntry>>()
  private getDatasetsByRegion(region: { fullId: string }){
    const fullId = getIdFromFullId(region.fullId)
    if (this.memoizedDatasetByRegion.has(fullId)) return this.memoizedDatasetByRegion.get(fullId)
    const obs$ =  this.http.get<IDataEntry>(
      `${this.constantService.backendUrl}datasets/byRegion/${encodeURIComponent(fullId)}`,
      {
        headers: this.constantService.getHttpHeader(),
        responseType: 'json'
      }
    ).pipe(
      shareReplay(1),
    )
    this.memoizedDatasetByRegion.set(fullId, obs$)
    return obs$
  }

  private lowLevelQuery(templateName: string, parcellationName: string): Promise<IDataEntry[]> {
    const encodedTemplateName = encodeURIComponent(templateName)
    const encodedParcellationName = encodeURIComponent(parcellationName)

    return this.http.get(
      `${this.constantService.backendUrl}datasets//templateNameParcellationName/${encodedTemplateName}/${encodedParcellationName}`,
      {
        headers: this.constantService.getHttpHeader(),
        responseType: 'json'
      }
    ).pipe(
      map((arr: any[]) => {
        const map = arr.reduce((acc, item) => {
          const newMap = new Map(acc)
          return newMap.set(item.name, item)
        }, new Map())
        return Array.from(map.values() as IDataEntry[])
      })
    ).toPromise()
  }

  private fetchData(templateName: string, parcellationName: string) {
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
          this.log.warn('Error fetching dataset', e)
          /**
           * TODO
           * retry?
           */
        }
      })
  }

  public rebuildRegionTree(selectedRegions, regions) {
    this.workerService.worker.postMessage({
      type: 'BUILD_REGION_SELECTION_TREE',
      selectedRegions,
      regions,
    })
  }

  public dbComponentInit(_db: DataBrowser) {
    this.store.dispatch({
      type: SHOW_KG_TOS,
    })
  }

  public getModalityFromDE = getModalityFromDE
}

export function reduceDataentry(accumulator: Array<{name: string, occurance: number}>, dataentry: IDataEntry) {
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
      occurance: 1,
    }
  }).concat(accumulator.map(({name, occurance, ...rest}) => {
    return {
      ...rest,
      name,
      occurance: methods.some(m => m === name)
        ? occurance + 1
        : occurance,
    }
  }))
}

export function getModalityFromDE(dataentries: IDataEntry[]): CountedDataModality[] {
  return dataentries.reduce((acc, de) => reduceDataentry(acc, de), [])
}

export function getIdFromDataEntry(dataentry: IDataEntry) {
  const { id, fullId } = dataentry
  const regex = /\/([a-zA-Z0-9-]*?)$/.exec(fullId)
  return (regex && regex[1]) || id
}

export interface CountedDataModality {
  name: string
  occurance: number
  visible: boolean
}

type Point = [number, number, number]
