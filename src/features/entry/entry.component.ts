import { AfterViewInit, ChangeDetectorRef, Component, Inject, QueryList, TemplateRef, ViewChildren, inject } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { debounceTime, distinctUntilChanged, map, scan, shareReplay, switchMap, take, takeUntil, withLatestFrom } from 'rxjs/operators';
import { IDS, SAPI } from 'src/atlasComponents/sapi';
import { Feature } from 'src/atlasComponents/sapi/sxplrTypes';
import { FeatureBase } from '../base';
import * as userInteraction from "src/state/userInteraction"
import { CategoryAccDirective } from "../category-acc.directive"
import { combineLatest, concat, forkJoin, merge, of, Subject } from 'rxjs';
import { DsExhausted, IsAlreadyPulling, PulledDataSource } from 'src/util/pullable';
import { TranslatedFeature } from '../list/list.directive';
import { MatDialog } from 'src/sharedModules/angularMaterial.exports';
import { DestroyDirective } from 'src/util/directives/destroy.directive';
import { FEATURE_CONCEPT_TOKEN, FeatureConcept, TPRB } from '../util';
import { SPECIES_ENUM } from 'src/util/constants';
import { atlasSelection } from 'src/state';

const categoryAcc = <T extends Record<string, unknown>>(categories: T[]) => {
  const returnVal: Record<string, T[]> = {}
  for (const item of categories) {
    const { category } = item
    if (!category) continue
    if (typeof category !== "string") continue
    if (!returnVal[category]) {
      returnVal[category] = []
    }
    returnVal[category].push(item)
  }
  return returnVal
}
type ConnectiivtyFilter = {
  SPECIES: string[]
  PARCELLATION: string[]
  SPACE: string[]
}

const WHITELIST_CONNECTIVITY: ConnectiivtyFilter = {
  SPECIES: [
    SPECIES_ENUM.RATTUS_NORVEGICUS,
    SPECIES_ENUM.HOMO_SAPIENS
  ],
  PARCELLATION: [
    IDS.PARCELLATION.JBA29,
    IDS.PARCELLATION.JBA30,
    IDS.PARCELLATION.WAXHOLMV4
  ],
  SPACE: [],
}

const BANLIST_CONNECTIVITY: ConnectiivtyFilter = {
  SPECIES: [],
  PARCELLATION: [],
  SPACE: [
    IDS.TEMPLATES.BIG_BRAIN
  ]
}

@Component({
  selector: 'sxplr-feature-entry',
  templateUrl: './entry.flattened.component.html',
  styleUrls: ['./entry.flattened.component.scss'],
  exportAs: 'featureEntryCmp',
  hostDirectives: [
    DestroyDirective
  ]
})
export class EntryComponent extends FeatureBase implements AfterViewInit {

  ondestroy$ = inject(DestroyDirective).destroyed$

  @ViewChildren(CategoryAccDirective)
  catAccDirs: QueryList<CategoryAccDirective>

  constructor(
    private sapi: SAPI,
    private store: Store,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    @Inject(FEATURE_CONCEPT_TOKEN) private featConcept: FeatureConcept,
  ) {
    super()

    this.TPRBbox$.pipe(
      takeUntil(this.ondestroy$)
    ).subscribe(tprb => {
      this.#tprb = tprb
    })
  }
  #tprb: TPRB

  #catAccDirs = new Subject<CategoryAccDirective[]>()
  features$ = this.#catAccDirs.pipe(
    switchMap(dirs => concat(
      of([] as TranslatedFeature[]),
      merge(...dirs.map((dir, idx) =>
        dir.datasource$.pipe(
          switchMap(ds =>  ds.data$),
          map(val => ({ val, idx }))
        ))
      ).pipe(
        map(({ idx, val }) => ({ [idx.toString()]: val })),
        scan((acc, curr) => ({ ...acc, ...curr })),
        map(record => Object.values(record).flatMap(v => v))
      )
    )),
    shareReplay(1),
  )

  busy$ = this.#catAccDirs.pipe(
    switchMap(dirs => combineLatest(
      dirs.map(dir => dir.isBusy$)
    )),
    map(flags => flags.some(flag => flag)),
    distinctUntilChanged(),
    shareReplay(1)
  )

  public busyTallying$ = this.#catAccDirs.pipe(
    switchMap(arr => concat(
      of(true),
      forkJoin(
        arr.map(dir => dir.total$.pipe(
          take(1)
        ))
      ).pipe(
        map(() => false)
      )
    )),
    shareReplay(1)
  )

  public totals$ = this.#catAccDirs.pipe(
    switchMap(arr => concat(
      of(0),
      merge(
        ...arr.map((dir, idx) =>
          dir.total$.pipe(
            map(val => ({ val, idx }))
          )
        )
      ).pipe(
        map(({ idx, val }) => ({ [idx.toString()]: val })),
        scan((acc, curr) => ({ ...acc, ...curr })),
        map(record => {
          let tally = 0
          for (const idx in record) {
            tally += record[idx]
          }
          return tally
        }),
      )
    ))
  )

  ngAfterViewInit(): void {
    merge(
      of(null),
      this.catAccDirs.changes
    ).pipe(
      map(() => Array.from(this.catAccDirs)),
      takeUntil(this.ondestroy$),
    ).subscribe(dirs => this.#catAccDirs.next(dirs))

    this.#pullAll.pipe(
      debounceTime(320),
      withLatestFrom(this.#catAccDirs),
      switchMap(([_, dirs]) => combineLatest(dirs.map(dir => dir.datasource$))),
      takeUntil(this.ondestroy$),
    ).subscribe(async dss => {
      await Promise.all(
        dss.map(async ds => {
          // eslint-disable-next-line no-constant-condition
          while (true) {
            try {
              await ds.pull()
            } catch (e) {
              if (e instanceof DsExhausted) {
                break
              }
              if (e instanceof IsAlreadyPulling ) {
                continue
              }
              throw e
            }
          }
        })
      )
    })
  }

  public selectedAtlas$ = this.store.pipe(
    select(atlasSelection.selectors.selectedAtlas)
  )

  public showConnectivity$ = combineLatest([
    this.selectedAtlas$.pipe(
      map(atlas => WHITELIST_CONNECTIVITY.SPECIES.includes(atlas?.species) && !BANLIST_CONNECTIVITY.SPECIES.includes(atlas?.species))
    ),
    this.TPRBbox$.pipe(
      map(({ parcellation, template }) => (
        WHITELIST_CONNECTIVITY.SPACE.includes(template?.id) && !BANLIST_CONNECTIVITY.SPACE.includes(template?.id)
      ) || (
        WHITELIST_CONNECTIVITY.PARCELLATION.includes(parcellation?.id) && !BANLIST_CONNECTIVITY.PARCELLATION.includes(parcellation?.id)
      ))
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
    switchMap(({ template, parcellation, region, bbox }) => this.featureTypes$.pipe(
      map(features => {
        const filteredFeatures = features.filter(v => {
          const { path_params, required_query_params } = v
          
          const requiredParams = [
            ...(path_params || []),
            ...(required_query_params || []),
          ]
          const paramMapped = {
            space_id: !!template,
            parcellation_id: !!parcellation,
            region_id: !!region,
            bbox: !!bbox
          }
          for (const pParam in paramMapped){
            if (requiredParams.includes(pParam) && !paramMapped[pParam]) {
              return false
            }
          }
          return true
        })
        return categoryAcc(filteredFeatures)
      }),
    )),
  )

  onClickFeature(feature: Feature) {

    /**
     * register of TPRB (template, parcellation, region, bbox) *has* to 
     * happen at the moment when feature is selected
     */
    this.featConcept.register(feature.id, this.#tprb)

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
        this.cdr.detectChanges()
      } catch (e) {
        if (e instanceof IsAlreadyPulling || e instanceof DsExhausted) {
          return
        }
        throw e
      }
    }
  }

  #pullAll = new Subject()
  pullAll(){
    this.#pullAll.next(null)
  }

  openDialog(tmpl: TemplateRef<unknown>){
    this.dialog.open(tmpl)
  }
}
