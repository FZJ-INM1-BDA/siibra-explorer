import { AfterViewInit, Component, OnDestroy, QueryList, ViewChildren } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { map, scan, switchMap, tap } from 'rxjs/operators';
import { IDS, SAPI } from 'src/atlasComponents/sapi';
import { Feature } from 'src/atlasComponents/sapi/sxplrTypes';
import { FeatureBase } from '../base';
import * as userInteraction from "src/state/userInteraction"
import { atlasSelection } from 'src/state';
import { CategoryAccDirective } from "../category-acc.directive"
import { BehaviorSubject, combineLatest, merge, of, Subscription } from 'rxjs';
import { IsAlreadyPulling, PulledDataSource } from 'src/util/pullable';

const categoryAcc = <T extends Record<string, unknown>>(categories: T[]) => {
  const returnVal: Record<string, T[]> = {}
  for (const item of categories) {
    const { category, ...rest } = item
    if (!category) continue
    if (typeof category !== "string") continue
    if (!returnVal[category]) {
      returnVal[category] = []
    }
    returnVal[category].push(item)
  }
  return returnVal
}

@Component({
  selector: 'sxplr-feature-entry',
  templateUrl: './entry.flattened.component.html',
  styleUrls: ['./entry.flattened.component.scss'],
  exportAs: 'featureEntryCmp'
})
export class EntryComponent extends FeatureBase implements AfterViewInit, OnDestroy {

  @ViewChildren(CategoryAccDirective)
  catAccDirs: QueryList<CategoryAccDirective>

  public busyTallying$ = new BehaviorSubject<boolean>(false)
  public totals$ = new BehaviorSubject<number>(null)

  constructor(private sapi: SAPI, private store: Store) {
    super()
  }

  #subscriptions: Subscription[] = []

  ngOnDestroy(): void {
    while (this.#subscriptions.length > 0) this.#subscriptions.pop().unsubscribe()
  }
  ngAfterViewInit(): void {
    const catAccDirs$ = merge(
      of(null),
      this.catAccDirs.changes
    ).pipe(
      map(() => Array.from(this.catAccDirs))
    )
    this.#subscriptions.push(
      catAccDirs$.pipe(
        tap(() => this.busyTallying$.next(true)),
        switchMap(catArrDirs => merge(
          ...catArrDirs.map((dir, idx) => dir.total$.pipe(
            map(val => ({ idx, val }))
          ))
        )),
        
        map(({ idx, val }) => ({ [idx.toString()]: val })),
        scan((acc, curr) => ({ ...acc, ...curr })),
        map(record => {
          let tally = 0
          for (const idx in record) {
            tally += record[idx]
          }
          return tally
        }),
        tap(num => {
          this.busyTallying$.next(false)
          this.totals$.next(num)
        }),
      ).subscribe(),
    )
  }

  public selectedAtlas$ = this.store.pipe(
    select(atlasSelection.selectors.selectedAtlas)
  )

  public showConnectivity$ = combineLatest([
    this.selectedAtlas$.pipe(
      map(atlas => atlas?.species === "Homo sapiens")
    ),
    this.TPRBbox$.pipe(
      map(({ parcellation }) => parcellation?.id === IDS.PARCELLATION.JBA29)
    )
  ]).pipe(
    map(flags => flags.every(f => f))
  )

  private featureTypes$ = this.sapi.v3Get("/feature/_types", {}).pipe(
    switchMap(resp => 
      this.sapi.iteratePages(
        resp,
        page => this.sapi.v3Get(
          "/feature/_types",
          { query: { page } }
        )
      )
    ),
  )

  public cateogryCollections$ = this.TPRBbox$.pipe(
    switchMap(({ template, parcellation, region }) => this.featureTypes$.pipe(
      map(features => {
        const filteredFeatures = features.filter(v => {
          const params = [
            ...(v.path_params || []),
            ...(v.query_params || []),
          ]
          return [
            params.includes("space_id") === (!!template) && !!template,
            params.includes("parcellation_id") === (!!parcellation) && !!parcellation,
            params.includes("region_id") === (!!region) && !!region,
          ].some(val => val)
        })
        return categoryAcc(filteredFeatures)
      }),
    )),
  )

  onClickFeature(feature: Feature) {
    this.store.dispatch(
      userInteraction.actions.showFeature({
        feature
      })
    )
  }

  async onScroll(datasource: PulledDataSource<unknown>, scrollIndex: number){
    if ((datasource.currentValue.length - scrollIndex) < 30) {
      try {
        await datasource.pull()
      } catch (e) {
        if (e instanceof IsAlreadyPulling) {
          return
        }
        throw e
      }
    }
  }
}
