import { ChangeDetectionStrategy, Component, Inject, Input, inject } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, concat, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, shareReplay, switchMap, takeUntil, withLatestFrom } from 'rxjs/operators';
import { SAPI } from 'src/atlasComponents/sapi/sapi.service';
import { Feature, SimpleCompoundFeature, VoiFeature } from 'src/atlasComponents/sapi/sxplrTypes';
import { DARKTHEME } from 'src/util/injectionTokens';
import { isVoiData, notQuiteRight } from "../guards"
import { Action, Store, select } from '@ngrx/store';
import { atlasSelection, userInteraction } from 'src/state';
import { PathReturn } from 'src/atlasComponents/sapi/typeV3';
import { CFIndex } from '../compoundFeatureIndices';
import { ComponentStore } from '@ngrx/component-store';
import { DestroyDirective } from 'src/util/directives/destroy.directive';
import { FEATURE_CONCEPT_TOKEN, FeatureConcept } from '../util';

type FeatureCmpStore = {
  selectedCmpFeature: SimpleCompoundFeature|null
}

type PlotlyResponse = PathReturn<"/feature/{feature_id}/plotly">

function isSimpleCompoundFeature(feat: unknown): feat is SimpleCompoundFeature{
  return !!(feat?.['indices'])
}

const passRegionIdFeatureIds = [
  "1a19693d-d99f-4789-b1ae-8ab5f0bb6432",
]

@Component({
  selector: 'sxplr-feature-view',
  templateUrl: './feature-view.component.html',
  styleUrls: ['./feature-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    ComponentStore
  ],
  hostDirectives: [
    DestroyDirective
  ]
})
export class FeatureViewComponent {

  destroyed$ = inject(DestroyDirective).destroyed$

  busy$ = new BehaviorSubject<boolean>(false)

  #feature$ = new BehaviorSubject<Feature|SimpleCompoundFeature>(null)
  @Input()
  set feature(val: Feature|SimpleCompoundFeature) {
    this.#feature$.next(val)
  }

  #featureId = this.#feature$.pipe(
    map(f => f.id)
  )

  #featureDetail$ = this.#featureId.pipe(
    switchMap(fid => this.sapi.getV3FeatureDetailWithId(fid)),
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

  #warnings$ = this.#feature$.pipe(
    switchMap(() => concat(
      of([] as string[]),
      this.#featureDetail$.pipe(
        catchError(() => of(null)),
        map(notQuiteRight),
      )
    ))
  )
  #passRegionId$ = this.#feature$.pipe(
    map(v => v.category === "connectivity" || passRegionIdFeatureIds.some(id => v.id.includes(id)))
  )

  #selectedRegion$ = this.store.pipe(
    select(atlasSelection.selectors.selectedRegions)
  )

  #additionalParams$: Observable<Record<string, string>> = this.#passRegionId$.pipe(
    withLatestFrom(this.#selectedRegion$),
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

  #loadingDetail$ = this.#feature$.pipe(
    switchMap(() => concat(
      of(true),
      this.#featureDetail$.pipe(
        catchError(() => of(null)),
        map(() => false)
      )
    ))
  )
  
  #loadingPlotly$ = this.#plotlyInput$.pipe(
    switchMap(() => concat(
      of(true),
      this.#plotly$.pipe(
        map(() => false)
      )
    )),
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
  
  #detailLinks = this.#feature$.pipe(
    switchMap(() => concat(
      of([] as string[]),
      this.#featureDetail$.pipe(
        catchError(() => of(null as null)),
        map(val => (val?.link || []).map(l => l.href))
      )
    ))
  )

  #compoundFeatEmts$ = this.#feature$.pipe(
    map(f => {
      if (isSimpleCompoundFeature(f)) {
        return f.indices
      }
      return null
    })
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

  // intents$ = this.#isConnectivity$.pipe(
  //   withLatestFrom(this.#featureId, this.#selectedRegion$),
  //   switchMap(([flag, fid, selectedRegion]) => {
  //     if (!flag) {
  //       return EMPTY
  //     }
  //     return this.sapi.getFeatureIntents(fid, {
  //       region: selectedRegion.map(r => r.name).join(" ")
  //     }).pipe(
  //       switchMap(val => 
  //         this.sapi.iteratePages(
  //           val,
  //           page => this.sapi.getFeatureIntents(fid, {
  //             region: selectedRegion.map(r => r.name).join(" "),
  //             page: page.toString()
  //           }
  //         )
  //       ))
  //     )
  //   })
  // )

  constructor(
    private sapi: SAPI,
    private store: Store,
    private readonly cmpStore: ComponentStore<FeatureCmpStore>,
    @Inject(DARKTHEME) public darktheme$: Observable<boolean>,
    @Inject(FEATURE_CONCEPT_TOKEN) private featConcept: FeatureConcept,
  ) {
    this.cmpStore.setState({ selectedCmpFeature: null })

    this.#feature$.pipe(
      takeUntil(this.destroyed$),
      filter(isSimpleCompoundFeature),
    ).subscribe(selectedCmpFeature => {
      this.cmpStore.patchState({ selectedCmpFeature })
    })
  }

  navigateToRegionByName(regionName: string){
    this.store.dispatch(
      atlasSelection.actions.navigateToRegion({
        region: {
          name: regionName
        }
      })
    )
  }

  onAction(action: Action){
    this.store.dispatch(action)
  }

  #etheralView$ = combineLatest([
    this.cmpStore.state$,
    this.#feature$,
    this.featConcept.concept$
  ]).pipe(
    map(([ { selectedCmpFeature }, feature, selectedConcept ]) => {
      const { id: selectedConceptFeatId, concept } = selectedConcept
      const prevCmpFeat: SimpleCompoundFeature = selectedCmpFeature?.indices.some(idx => idx.id === feature?.id) && selectedCmpFeature || null
      return {
        prevCmpFeat,
        concept: selectedConceptFeatId === feature.id && concept || null
      }
    })
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
    this.#compoundFeatEmts$,
    this.store.pipe(
      select(atlasSelection.selectors.selectedTemplate)
    ),
  ]).pipe(
    map(([ voi, plotly, cmpFeatElmts, selectedTemplate ]) => {
      return {
        voi, plotly, cmpFeatElmts, selectedTemplate, 
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
    this.#warnings$,
    this.additionalLinks$,
    this.downloadLink$,
    this.#featureDesc$
  ]).pipe(
    map(([ feature, busy, warnings, additionalLinks, downloadLink, desc ]) => {
      return {
        featureId: feature.id,
        name: feature.name,
        links: feature.link,
        category: feature.category === 'Unknown category'
        ? `Other feature`
        : `${feature.category} feature`,
        busy,
        warnings,
        additionalLinks,
        downloadLink,
        desc
      }
    })
  )

  view$ = combineLatest([
    this.#baseView$,
    this.#specialView$,
    this.#etheralView$
  ]).pipe(
    map(([obj1, obj2, obj3]) => {
      return {
        ...obj1,
        ...obj2,
        ...obj3,
      }
    })
  )
  
  showSubfeature(item: CFIndex|Feature){
    this.store.dispatch(
      userInteraction.actions.showFeature({
        feature: item
      })
    )
  }
  
  clearSelectedFeature(): void{
    this.store.dispatch(
      userInteraction.actions.clearShownFeature()
    )
  }

}
