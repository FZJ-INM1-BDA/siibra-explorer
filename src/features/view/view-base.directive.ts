import { Directive, Inject, Input } from "@angular/core";
import { BehaviorSubject, combineLatest, concat, Observable, of } from "rxjs";
import { catchError, debounceTime, distinctUntilChanged, map, shareReplay, switchMap, withLatestFrom } from "rxjs/operators";
import { SAPI } from "src/atlasComponents/sapi";
import { Feature, SimpleCompoundFeature, SxplrRegion, SxplrTemplate, VoiFeature } from "src/atlasComponents/sapi/sxplrTypes";
import { PathReturn } from "src/atlasComponents/sapi/typeV3";
import { isVoiData, notQuiteRight } from "../guards";
import { DARKTHEME } from "src/util/injectionTokens";

type ExtraParams = Partial<{
  regions: SxplrRegion[]
  space: SxplrTemplate
}>

type PlotlyResponse = PathReturn<"/feature/{feature_id}/plotly">

@Directive({
  selector: '[feature-view-base]',
  exportAs: 'featureViewBase'
})
export class FeatureViewBase {

  busy$ = new BehaviorSubject<boolean>(false)

  #feature$ = new BehaviorSubject<Feature|SimpleCompoundFeature>(null)
  @Input()
  set feature(val: Feature|SimpleCompoundFeature) {
    this.#feature$.next(val)
  }

  #extraParams = new BehaviorSubject<ExtraParams>(null)
  @Input()
  set extraParams(val: ExtraParams){
    this.#extraParams.next(val)
  }

  #featureId = this.#feature$.pipe(
    map(f => f.id)
  )

  #featureDetail$ = this.#featureId.pipe(
    switchMap(fid => this.sapi.getV3FeatureDetailWithId(fid)),
  )
  
  #loadingDetail$ = this.#feature$.pipe(
    switchMap(() => concat(
      of(true),
      this.#featureDetail$.pipe(
        catchError(() => of(null)),
        map(() => false)
      )
    ))
  )


  #warnings$ = this.#feature$.pipe(
    switchMap(() => concat(
      of([] as string[]),
      this.#featureDetail$.pipe(
        catchError(() => of(null)),
        map(notQuiteRight),
      )
    ))
  )
  
  #isConnectivity$ = this.#feature$.pipe(
    map(v => v.category === "connectivity")
  )

  #additionalParams$: Observable<Record<string, string>> = this.#isConnectivity$.pipe(
    withLatestFrom(
      this.#extraParams.pipe(
        map(params => params?.regions)
      )
    ),
    map(([ isConnnectivity, selectedRegions ]) => isConnnectivity
    ? {"regions": selectedRegions.map(r => r.name).join(" ")}
    : {} )
  )

  #plotlyInput$ = combineLatest([
    this.#featureId,
    this.darktheme$,
    this.#additionalParams$,
  ]).pipe(
    debounceTime(16),
    map(([ id, darktheme, additionalParams ]) => ({ id, darktheme, additionalParams })),
    distinctUntilChanged((o, n) => o.id === n.id && o.darktheme === n.darktheme),
    shareReplay(1),
  )
  
  #plotly$: Observable<PlotlyResponse> = this.#plotlyInput$.pipe(
    switchMap(({ id, darktheme, additionalParams }) => {
      if (!id) {
        return of(null)
      }
      return concat(
        of(null),
        this.sapi.getFeaturePlot(
          id,
          {
            template: darktheme ? 'plotly_dark' : 'plotly_white',
            ...additionalParams
          }
        ).pipe(
          catchError(() => of(null))
        )
      )
    }),
    shareReplay(1),
  )
    
  #loadingPlotly$ = this.#plotlyInput$.pipe(
    switchMap(() => concat(
      of(true),
      this.#plotly$.pipe(
        map(() => false)
      )
    )),
  )
   
  #detailLinks = this.#feature$.pipe(
    switchMap(() => concat(
      of([] as string[]),
      this.#featureDetail$.pipe(
        catchError(() => of(null as null)),
        map(val => (val?.link || []).map(l => l.href))
      )
    ))
  ) 

  additionalLinks$ = this.#detailLinks.pipe(
    distinctUntilChanged((o, n) => o.length == n.length),
    withLatestFrom(this.#feature$),
    map(([links, feature]) => {
      const set = new Set((feature.link || []).map(v => v.href))
      return links.filter(l => !set.has(l))
    })
  )

  downloadLink$ = this.sapi.sapiEndpoint$.pipe(
    switchMap(endpoint => this.#featureId.pipe(
      map(featureId => `${endpoint}/feature/${featureId}/download`),
      shareReplay(1)
    ))
  )
  #featureDesc$ = this.#feature$.pipe(
    switchMap(() => concat(
      of(null as string),
      this.#featureDetail$.pipe(
        map(v => v?.desc),
        catchError((err) => {
          let errortext = 'Error fetching feature instance'

          if (err.error instanceof Error) {
            errortext += `:\n\n${err.error.toString()}`
          } else {
            errortext += '!'
          }
          
          return of(errortext)
        }),
      )
    ))
  )

  #featureContributors$ = concat(
    of([] as string[]),
    this.#featureDetail$.pipe(
      map(f => f.contributors)
    )
  )

  #derivedFeatProps$ = combineLatest([
    this.#warnings$,
    this.additionalLinks$,
    this.downloadLink$,
    this.#featureDesc$,
    this.#featureContributors$,
  ]).pipe(
    map(([ warnings, additionalLinks, downloadLink, desc, contributors ]) => {
      return {
        warnings, additionalLinks, downloadLink, desc, contributors
      }
    })
  )


  #baseView$ = combineLatest([
    this.#feature$,
    combineLatest([
      this.#loadingDetail$,
      this.#loadingPlotly$,
      this.busy$,
    ]).pipe(
      map(flags => flags.some(f => f))
    ),
    this.#derivedFeatProps$
  ]).pipe(
    map(([ feature, busy, { warnings, additionalLinks, downloadLink, desc, contributors } ]) => {
      return {
        featureId: feature.id,
        name: feature.name,
        links: feature.link,
        category: feature.category === 'Unknown category'
        ? `Feature: other`
        : `Feature: ${feature.category}`,
        busy,
        warnings,
        additionalLinks,
        downloadLink,
        desc,
        contributors,
      }
    })
  )

  #voi$: Observable<VoiFeature> = this.#feature$.pipe(
    switchMap(() => concat(
      of(null),
      this.#featureDetail$.pipe(
        catchError(() => of(null)),
        map(val => {
          if (isVoiData(val)) {
            return val
          }
          return null
        })
      )
    ))
  )
  #specialView$ = combineLatest([
    concat(
      of(null as VoiFeature),
      this.#voi$
    ),
    concat(
      of(null as PlotlyResponse),
      this.#plotly$,
    ),
    this.#extraParams
  ]).pipe(
    map(([ voi, plotly, param ]) => {
      return {
        voi, plotly, cmpFeatElmts: null, selectedTemplate: param?.space, 
      }
    })
  )

  view$ = combineLatest([
    this.#baseView$,
    this.#specialView$,
  ]).pipe(
    map(([baseview, specialview]) => {
      
      return {
        ...baseview,
        ...specialview,
        
      }
    })
  )

  constructor(
    protected sapi: SAPI,
    @Inject(DARKTHEME) protected darktheme$: Observable<boolean>,
  ){

  }
}