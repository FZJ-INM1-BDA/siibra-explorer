import { Input, Directive, SimpleChanges, OnDestroy } from "@angular/core";
import { BehaviorSubject, combineLatest, forkJoin, of, Subject, Subscription } from "rxjs";
import { distinctUntilChanged, shareReplay, startWith, switchMap } from "rxjs/operators";
import { SAPI } from "src/atlasComponents/sapi";
import { FeatureType } from "src/atlasComponents/sapi/typeV3";
import { AllFeatures, FeatureBase } from "../base";
import { PulledDataSource } from "src/util/pullable";
import {
  translateV3Entities
} from "src/atlasComponents/sapi/translateV3"


export type TranslatedFeature = Awaited< ReturnType<(typeof translateV3Entities)['translateFeature']> >

@Directive({
  selector: '[sxplr-feature-list-directive]',
  exportAs: 'featureListDirective'
})
export class ListDirective extends FeatureBase  implements OnDestroy{

  @Input()
  name: string

  @Input()
  displayName: string

  @Input()
  featureRoute: string
  private guardedRoute$ = new BehaviorSubject<FeatureType>(null)

  #total = new Subject<number>()
  total$ = this.#total.pipe(
    distinctUntilChanged(),
  )
  
  private _datasource$ = new Subject<PulledDataSource<TranslatedFeature>>()
  datasource$ = this._datasource$.asObservable().pipe(
    shareReplay(1)
  )

  public isBusy$ = this.datasource$.pipe(
    switchMap(ds => ds.isPulling$),
    startWith(false)
  )

  #params = combineLatest([
    this.guardedRoute$,
    this.TPRBbox$,
  ])

  #subscription: Subscription[] = []

  ngOnDestroy(): void {
    while (this.#subscription.length > 0) this.#subscription.pop().unsubscribe()
  }

  constructor(private sapi: SAPI) {
    super()
    this.#subscription.push(
      this.#params.subscribe(([ route, { template, parcellation, region, bbox } ]) => {
        let page: number = 1
        let totalPages: number = null
        const datasource = new PulledDataSource({
          pull: async () => {
            if (totalPages && page > totalPages) {
              return []
            }
            const query: any = {}
            if (template) query['space_id'] = template.id
            if (parcellation) query['parcellation_id'] = parcellation.id
            if (region) query['region_id'] = region.name
            if (bbox) query['bbox'] = JSON.stringify(bbox)

            /**
             * some routes, such as geneexpression, are specifically disabled
             */
            if (!route) {
              totalPages = 0
              this.#total.next(0)
              return []
            }

            try {

              const results = await this.sapi.v3Get(`/feature/${route}`, {
                query: {
                  ...this.queryParams,
                  ...query,
                  page
                }
              }).pipe(
                switchMap(resp => {
                  totalPages = resp.pages || 0
                  this.#total.next(resp.total || 0)
                  if (resp.items.length === 0) {
                    return of([] as TranslatedFeature[])
                  }
                  return forkJoin(
                    resp.items.map(feature => translateV3Entities.translateFeature(feature))
                  )
                })
              ).toPromise()
              page += 1
              return results
            } catch (e) {
              console.error(`Datasource Error:`)
              console.error(e)
              
              totalPages = 0
              this.#total.next(0)
              return []
            }
          },
          annotations: {
            ...this.queryParams,
          }
        })
        this._datasource$.next(datasource)
        datasource.pull()
      })
    )
  }

  ngOnChanges(sc: SimpleChanges): void {
    super.ngOnChanges(sc)
    const { featureRoute } = sc
    if (featureRoute) {
      const featureType = (featureRoute.currentValue || '').split("/").slice(-1)[0]
      this.guardedRoute$.next(AllFeatures[featureType])
    }
  }
}
