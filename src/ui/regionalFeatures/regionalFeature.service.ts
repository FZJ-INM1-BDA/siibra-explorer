import { HttpClient } from "@angular/common/http";
import { Inject, Injectable, OnDestroy, Optional } from "@angular/core";
import { PureContantService } from "src/util";
import { getIdFromFullId, getRegionHemisphere, getStringIdsFromRegion, flattenReducer } from 'common/util'
import { forkJoin, from, Observable, of, Subject, Subscription } from "rxjs";
import { catchError, map, mapTo, shareReplay, switchMap, tap } from "rxjs/operators";
import { IHasId } from "src/util/interfaces";
import { select, Store } from "@ngrx/store";
import { viewerStateSelectedTemplateSelector } from "src/services/state/viewerState/selectors";
import { viewerStateAddUserLandmarks, viewreStateRemoveUserLandmarks } from "src/services/state/viewerState/actions";
import { uiStateMouseoverUserLandmark } from "src/services/state/uiState/selectors";
import { APPEND_SCRIPT_TOKEN } from "src/util/constants";

const libraries = [
  'https://cdnjs.cloudflare.com/ajax/libs/d3/5.7.0/d3.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.1.2/es5/tex-svg.js'
]

export interface IFeature extends IHasId{
  type: string
  name: string
  data?: IHasId[]
}

@Injectable({
  providedIn: 'root'
})

export class RegionalFeaturesService implements OnDestroy{

  public depScriptLoaded$: Observable<boolean>

  private subs: Subscription[] = []
  private templateSelected: any
  constructor(
    private http: HttpClient,
    private pureConstantService: PureContantService,
    private store$: Store<any>,
    @Optional() @Inject(APPEND_SCRIPT_TOKEN) private appendScript: (src: string) => Promise<HTMLScriptElement>
  ){
    this.subs.push(
      this.store$.pipe(
        select(viewerStateSelectedTemplateSelector)
      ).subscribe(val => this.templateSelected = val)
    )

    this.depScriptLoaded$ = this.appendScript
      ? from(
          libraries.map(this.appendScript)
        ).pipe(
          mapTo(true),
          catchError(() => of(false)),
          shareReplay(1),
        )
      : of(false)
  }

  public mapFeatToCmp = new Map<string, any>()

  ngOnDestroy(){
    while (this.subs.length > 0) this.subs.pop().unsubscribe()
  }

  public onHoverLandmarks$ = this.store$.pipe(
    select(uiStateMouseoverUserLandmark)
  )

  public getAllFeaturesByRegion(region: {['fullId']: string}){
    if (!region.fullId) throw new Error(`getAllFeaturesByRegion - region does not have fullId defined`)
    const regionFullIds = getStringIdsFromRegion(region)
    const hemisphereObj = (() => {
      const hemisphere = getRegionHemisphere(region)
      return hemisphere ? { hemisphere } : {}
    })()

    const refSpaceObj = this.templateSelected && this.templateSelected.fullId
      ? { referenceSpaceId: getIdFromFullId(this.templateSelected.fullId) }
      : {}
    
    return forkJoin(
      regionFullIds.map(regionFullId => this.http.get<{features: IHasId[]}>(
        `${this.pureConstantService.backendUrl}regionalFeatures/byRegion/${encodeURIComponent( regionFullId )}`,
        {
          params: {
            ...hemisphereObj,
            ...refSpaceObj,
          },
          responseType: 'json'
        }
      ).pipe(
        switchMap(({ features }) => forkJoin(
          features.map(({ ['@id']: featureId }) => 
            this.http.get<IFeature>(
              `${this.pureConstantService.backendUrl}regionalFeatures/byRegion/${encodeURIComponent( regionFullId )}/${encodeURIComponent( featureId )}`,
              {
                params: {
                  ...hemisphereObj,
                  ...refSpaceObj,
                },
                responseType: 'json'
              }
            )
          )
        )),
      ))
    ).pipe(
      map((arr: IFeature[][]) => arr.reduce(flattenReducer, []))
    )
  }

  public getFeatureData(region: any,feature: IFeature, data: IHasId){
    if (!feature['@id']) throw new Error(`@id attribute for feature is required`)
    if (!data['@id']) throw new Error(`@id attribute for data is required`)
    const refSpaceObj = this.templateSelected && this.templateSelected.fullId
      ? { referenceSpaceId: getIdFromFullId(this.templateSelected.fullId) }
      : {}
    const hemisphereObj = (() => {
      const hemisphere = getRegionHemisphere(region)
      return hemisphere ? { hemisphere } : {}
    })()

    const regionId = getIdFromFullId(region && region.fullId)
    const url = regionId
      ? `${this.pureConstantService.backendUrl}regionalFeatures/byRegion/${encodeURIComponent(regionId)}/${encodeURIComponent(feature['@id'])}/${encodeURIComponent(data['@id'])}`
      : `${this.pureConstantService.backendUrl}regionalFeatures/byFeature/${encodeURIComponent(feature['@id'])}/${encodeURIComponent(data['@id'])}`
    return this.http.get<IHasId>(
      url,
      {
        params: {
          ...hemisphereObj,
          ...refSpaceObj,
        },
        responseType: 'json'
      }
    )
  }

  public addLandmarks(lms: IHasId[]) {
    this.store$.dispatch(
      viewerStateAddUserLandmarks({
        landmarks: lms.map(lm => ({
          ...lm,
          id: lm['@id'],
          name: `region feature: ${lm['@id']}`
        }))
      })
    )
  }

  public removeLandmarks(lms: IHasId[]) {
    this.store$.dispatch(
      viewreStateRemoveUserLandmarks({
        payload: {
          landmarkIds: lms.map(l => l['@id'])
        }
      })
    )
  }

  showDatafeatureInfo$ = new Subject<{ fullId: string } | { name: string, description: string }>()
}
