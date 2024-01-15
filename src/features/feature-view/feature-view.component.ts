import { ChangeDetectionStrategy, Component, Inject, Input, OnChanges, OnDestroy } from '@angular/core';
import { BehaviorSubject, EMPTY, Observable, Subject, combineLatest, concat, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, shareReplay, switchMap, withLatestFrom } from 'rxjs/operators';
import { SAPI } from 'src/atlasComponents/sapi/sapi.service';
import { Feature, VoiFeature } from 'src/atlasComponents/sapi/sxplrTypes';
import { DARKTHEME } from 'src/util/injectionTokens';
import { isVoiData, notQuiteRight } from "../guards"
import { Store, select } from '@ngrx/store';
import { atlasAppearance, atlasSelection } from 'src/state';


const CONNECTIVITY_LAYER_ID = "connectivity-colormap-id"

@Component({
  selector: 'sxplr-feature-view',
  templateUrl: './feature-view.component.html',
  styleUrls: ['./feature-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeatureViewComponent implements OnChanges, OnDestroy {

  #cleanupCb: (() => void)[] = []

  @Input()
  feature: Feature

  #featureId = new BehaviorSubject<string>(null)
  #isConnectivity$ = new BehaviorSubject(false)

  #selectedRegion$ = this.store.pipe(
    select(atlasSelection.selectors.selectedRegions)
  )

  #allRegions$ = this.store.pipe(
    select(atlasSelection.selectors.selectedParcAllRegions)
  )

  #additionalParams$: Observable<Record<string, string>> = this.#isConnectivity$.pipe(
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
  
  loadingPlotly$ = this.#plotlyInput$.pipe(
    switchMap(() => concat(
      of(true),
      this.plotly$.pipe(
        map(() => false)
      )
    )),
    distinctUntilChanged()
  )

  plotly$ = this.#plotlyInput$.pipe(
    switchMap(({ id, darktheme, additionalParams }) => {
      if (!id) {
        return of(null)
      }
      return this.sapi.getFeaturePlot(
        id,
        {
          template: darktheme ? 'plotly_dark' : 'plotly_white',
          ...additionalParams
        }
      ).pipe(
        catchError(() => of(null))
      )
    }),
    shareReplay(1),
  )

  #detailLinks = new Subject<string[]>()
  additionalLinks$ = this.#detailLinks.pipe(
    distinctUntilChanged((o, n) => o.length == n.length),
    map(links => {
      const set = new Set((this.feature.link || []).map(v => v.href))
      return links.filter(l => !set.has(l))
    })
  )

  downloadLink$ = this.sapi.sapiEndpoint$.pipe(
    switchMap(endpoint => this.#featureId.pipe(
      map(featureId => `${endpoint}/feature/${featureId}/download`),
      shareReplay(1)
    ))
  )

  busy$ = new BehaviorSubject<boolean>(false)
  
  voi$ = new BehaviorSubject<VoiFeature>(null)

  warnings$ = new Subject<string[]>()

  constructor(
    private sapi: SAPI,
    private store: Store,
    @Inject(DARKTHEME) public darktheme$: Observable<boolean>,  
  ) {
    const sub = this.#isConnectivity$.pipe(
      withLatestFrom(this.#featureId, this.#selectedRegion$, this.#allRegions$),
      switchMap(([flag, fid, selelectedRegion, allRegions]) => {
        if (!flag) {
          return EMPTY
        }
        return this.sapi.getFeatureIntents(fid, {
          region: selelectedRegion.map(r => r.name).join(" ")
        }).pipe(
          map(pagedIntents => {
            const foundCm = pagedIntents.items.find(intent => intent['@type'] === "siibra-0.4/intent/colorization")
            if (!foundCm) {
              return null
            }
            const { region_mappings: regionMappings } = foundCm
            const regRgbTuple = regionMappings
              .map(({ region, rgb }) => {
                const foundRegion = allRegions.find(r => r.name === region.name)
                if (!foundRegion) {
                  return null
                }
                return [foundRegion, rgb] as const
              })
              .filter(v => !!v)

            const newMap = new Map(regRgbTuple)
            return newMap
          }),
        )
      }),
    ).subscribe(newCM => {
      if (!newCM) {
        this.store.dispatch(
          atlasAppearance.actions.removeCustomLayer({
            id: CONNECTIVITY_LAYER_ID
          })
        )
        return
      }
      
      this.store.dispatch(
        atlasAppearance.actions.addCustomLayer({
          customLayer: {
            clType: 'customlayer/colormap',
            id: CONNECTIVITY_LAYER_ID,
            colormap: newCM
          }
        })
      )
    })

    this.#cleanupCb.push(() => sub.unsubscribe())
  }

  ngOnDestroy(): void {
    while (this.#cleanupCb.length > 0) {
      this.#cleanupCb.pop()()
    }
    this.store.dispatch(
      atlasAppearance.actions.removeCustomLayer({
        id: CONNECTIVITY_LAYER_ID
      })
    )
  }

  ngOnChanges(): void {
    this.voi$.next(null)
    this.busy$.next(true)

    this.#featureId.next(this.feature.id)

    // TODO might actually not be right for bold
    this.#isConnectivity$.next(this.feature.category === "connectivity")

    this.sapi.getV3FeatureDetailWithId(this.feature.id).subscribe(
      val => {
        this.busy$.next(false)
        
        if (isVoiData(val)) {
          this.voi$.next(val)
        }

        this.warnings$.next(
          notQuiteRight(val)
        )

        this.#detailLinks.next((val.link || []).map(l => l.href))
        
      },
      () => this.busy$.next(false)
    )
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
}
