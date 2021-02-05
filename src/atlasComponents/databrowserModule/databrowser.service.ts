import { HttpClient } from "@angular/common/http";
import {ComponentRef, Injectable, OnDestroy} from "@angular/core";
import { select, Store } from "@ngrx/store";
import { BehaviorSubject, forkJoin, from, fromEvent, Observable, of, Subscription } from "rxjs";
import { catchError, debounceTime, distinctUntilChanged, filter, map, shareReplay, switchMap, withLatestFrom } from "rxjs/operators";
import { AtlasWorkerService } from "src/atlasViewer/atlasViewer.workerService.service";

// TODO remove dependency on widget unit module
import { WidgetUnit } from "src/widget";

import { LoggingService } from "src/logging";
import { SHOW_KG_TOS } from "src/services/state/uiState.store.helper";
import { DataBrowser } from "./databrowser/databrowser.component";
import { NO_METHODS } from "./util/filterDataEntriesByMethods.pipe";
import { FilterDataEntriesByRegion } from "./util/filterDataEntriesByRegion.pipe";
import { datastateActionToggleFav, datastateActionUnfavDataset, datastateActionFavDataset, datastateActionFetchedDataentries } from "src/services/state/dataState/actions";

import { getStringIdsFromRegion, getRegionHemisphere, getIdFromFullId } from 'common/util'
import { viewerStateSelectedTemplateSelector, viewerStateSelectorNavigation } from "src/services/state/viewerState/selectors";
import { BACKENDURL, getFetchOption, getHttpHeader } from "src/util/constants";
import { IKgDataEntry } from ".";

const SPATIAL_WIDTH = 600 
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
  public favedDataentries$: Observable<Partial<IKgDataEntry>[]>
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
  public getDataByRegion: (arg: {regions: any[] }) => Observable<IKgDataEntry[]> = ({ regions }) => 
    forkJoin(regions.map(this.getDatasetsByRegion.bind(this))).pipe(
      map(
        (arrOfArr: IKgDataEntry[][]) => arrOfArr.reduce(
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
  private dataentries: IKgDataEntry[] = []

  private subscriptions: Subscription[] = []
  public manualFetchDataset$: BehaviorSubject<null> = new BehaviorSubject(null)

  private spatialDatasets$: Observable<any>
  public viewportBoundingBox$: Observable<[Point, Point]>

  private templateSelected: any

  constructor(
    private workerService: AtlasWorkerService,
    
    private store: Store<any>,
    private http: HttpClient,
    private log: LoggingService,
  ) {

    this.kgTos$ = this.http.get(`${BACKENDURL}datasets/tos`, {
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
        select('fetchedDataEntries'),
      ).subscribe(de => {
        this.dataentries = de
      }),
    )

    this.subscriptions.push(
      this.store.pipe(
        select(viewerStateSelectedTemplateSelector)
      ).subscribe(tmpl => {
        this.templateSelected = tmpl
      })
    )

    this.viewportBoundingBox$ = this.store.pipe(
      select(viewerStateSelectorNavigation),
      distinctUntilChanged(),
      debounceTime(SPATIAL_SEARCH_DEBOUNCE),
      filter(v => !!v && !!v.position && !!v.zoom),
      map(({ position, zoom }) => {

        // in mm
        const center = position.map(n => n / 1e6)
        const searchWidth = SPATIAL_WIDTH / 4 * zoom / 1e6
        const pt1 = center.map(v => (v - searchWidth)) as [number, number, number]
        const pt2 = center.map(v => (v + searchWidth)) as [number, number, number]

        return [pt1, pt2] as [Point, Point]
      }),
    )

    this.spatialDatasets$ = this.viewportBoundingBox$.pipe(
      withLatestFrom(this.store.pipe(
        select(viewerStateSelectedTemplateSelector),
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
        // spatial dataset has halted for the time being
        return of(null)
        // return this.http.get(`${BACKENDURL}datasets/spatialSearch/templateName/${encodedTemplateName}/bbox/${_bbox[0].join('_')}__${_bbox[1].join("_")}`).pipe(
        //   catchError((err) => (this.log.log(err), of([]))),
        // )
      }),
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

  public toggleFav(dataentry: Partial<IKgDataEntry>) {
    this.store.dispatch(
      datastateActionToggleFav({
        payload: {
          fullId: dataentry.fullId || null
        }
      })
    )
  }

  public saveToFav(dataentry: Partial<IKgDataEntry>) {
    this.store.dispatch(
      datastateActionFavDataset({
        payload: {
          fullId: dataentry?.fullId || null
        }
      })
    )
  }

  public removeFromFav(dataentry: Partial<IKgDataEntry>) {
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
      fetch(`${BACKENDURL}datasets/preview/${encodedDatasetName}`, getFetchOption())
        .then(res => res.json())
        .then(resolve)
        .catch(reject)
    })
  }

  private dispatchData(arr: IKgDataEntry[]) {
    this.store.dispatch(
      datastateActionFetchedDataentries({
        fetchedDataEntries: arr
      })
    )
  }

  public fetchedFlag: boolean = false
  public fetchError: string
  public fetchingFlag: boolean = false
  private mostRecentFetchToken: any

  private memoizedDatasetByRegion = new Map<string, Observable<IKgDataEntry[]>>()
  private getDatasetsByRegion(region: { fullId: any }){

    const hemisphereObj = (() => {
      const hemisphere = getRegionHemisphere(region)
      return hemisphere ? { hemisphere } : {}
    })()

    const refSpaceObj = this.templateSelected && this.templateSelected.fullId
      ? { referenceSpaceId: getIdFromFullId(this.templateSelected.fullId) }
      : {}
    const fullIds = getStringIdsFromRegion(region) as string[]

    for (const fullId of fullIds) {
      if (!this.memoizedDatasetByRegion.has(fullId)) {
        const obs$ =  this.http.get<IKgDataEntry[]>(
          `${BACKENDURL}datasets/byRegion/${encodeURIComponent(fullId)}`,
          {
            params: {
              ...hemisphereObj,
              ...refSpaceObj
            },
            headers: getHttpHeader(),
            responseType: 'json'
          }
        ).pipe(
          shareReplay(1),
        )
        this.memoizedDatasetByRegion.set(fullId, obs$)
      }
    }

    return forkJoin(
      fullIds.map(fullId => this.memoizedDatasetByRegion.get(fullId))
    ).pipe(
      map(array => array.reduce((acc, currArr) => {
        return acc.concat(
          currArr.filter(ds => !new Set(acc.map(ds => ds['fullId'])).has(ds['fullId']))
        )
      }, []))
    )
  }

  private lowLevelQuery(templateName: string, parcellationName: string): Promise<IKgDataEntry[]> {
    const encodedTemplateName = encodeURIComponent(templateName)
    const encodedParcellationName = encodeURIComponent(parcellationName)

    return this.http.get(
      `${BACKENDURL}datasets//templateNameParcellationName/${encodedTemplateName}/${encodedParcellationName}`,
      {
        headers: getHttpHeader(),
        responseType: 'json'
      }
    ).pipe(
      map((arr: any[]) => {
        const map = arr.reduce((acc, item) => {
          const newMap = new Map(acc)
          return newMap.set(item.name, item)
        }, new Map())
        return Array.from(map.values() as IKgDataEntry[])
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

export function reduceDataentry(accumulator: Array<{name: string, occurance: number}>, dataentry: IKgDataEntry) {
  const methods = (dataentry.methods || [])
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

export function getModalityFromDE(dataentries: IKgDataEntry[]): CountedDataModality[] {
  return dataentries.reduce((acc, de) => reduceDataentry(acc, de), [])
}

export function getIdFromDataEntry(dataentry: IKgDataEntry) {
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
