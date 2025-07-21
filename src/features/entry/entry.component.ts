import { AfterViewInit, ChangeDetectorRef, Component, Inject, QueryList, TemplateRef, ViewChildren, inject } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { debounceTime, distinctUntilChanged, map, scan, shareReplay, switchMap, take, takeUntil, withLatestFrom } from 'rxjs/operators';
import { IDS, SAPI } from 'src/atlasComponents/sapi';
import { Feature } from 'src/atlasComponents/sapi/sxplrTypes';
import * as userInteraction from "src/state/userInteraction"
import { CategoryAccDirective } from "../category-acc.directive"
import { combineLatest, concat, EMPTY, forkJoin, from, merge, of, Subject } from 'rxjs';
import { DsExhausted, IsAlreadyPulling, PulledDataSource } from 'src/util/pullable';
import { TranslatedFeature } from '../list/list.directive';
import { MatDialog, MatSnackBar } from 'src/sharedModules/angularMaterial.exports';
import { DestroyDirective } from 'src/util/directives/destroy.directive';
import { FEATURE_CONCEPT_TOKEN, FeatureConcept, TPRB } from '../util';
import { atlasSelection, userPreference } from 'src/state';
import { ExperimentalService } from 'src/experimental/experimental.service';
import { BANLIST_CONNECTIVITY, EXPERIMENTAL_CONNECTIVITY, WHITELIST_CONNECTIVITY } from '../connectivity';
import { TPBRCategoryDirective } from '../tpbrCategory.directive';

@Component({
  selector: 'sxplr-feature-entry',
  templateUrl: './entry.flattened.component.html',
  styleUrls: ['./entry.flattened.component.scss'],
  exportAs: 'featureEntryCmp',
  hostDirectives: [
    DestroyDirective
  ]
})
export class EntryComponent extends TPBRCategoryDirective implements AfterViewInit {

  ondestroy$ = inject(DestroyDirective).destroyed$

  @ViewChildren(CategoryAccDirective)
  catAccDirs: QueryList<CategoryAccDirective>

  constructor(
    sapi: SAPI,
    private store: Store,
    private dialog: MatDialog,
    private snackbar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private expmtSvc: ExperimentalService,
    @Inject(FEATURE_CONCEPT_TOKEN) private featConcept: FeatureConcept,
  ) {
    super(sapi)

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

  geometry$ = combineLatest([
    this.store.pipe(
      select(userPreference.selectors.showExperimental)
    ),
    this.TPRBbox$.pipe(
      shareReplay(1)
    ),
  ]).pipe(
    switchMap(([showExmptFlag, val]) => {
      if (!showExmptFlag || !val) {
        return of([])
      }
      const { template, bbox } = val
      if (template.id !== IDS.TEMPLATES.AMBA_CCF_V3) {
        return of([])
      }
      const translateMm = [11400000 - 5737500, 13200000 - 6637500 + 1e6, 8000000 - 4037500].map(v => v/1e6)

      const bboxStr = bbox.map(triplet => 
        triplet.map((v, idx) => translateMm[idx] - v).join(",")
      ).reverse().join("/")

      const tmpHost = `https://zam12230.jsc.fz-juelich.de/macaque-md/geometry/`
      return concat(
        of([]),
        from(
          fetch(`${tmpHost}/foo/0/${bboxStr}/stat`).then(res => res.json())
        ).pipe(
          switchMap(result => {
            if ((result.count || 1e10) > 1e5) {
              this.snackbar.open(`Pointclouds: too many points. Zoom in further to visualize.`, null, { duration: 2500 })
              return EMPTY
            }
            return from(
              fetch(`${tmpHost}/foo/0/${bboxStr}/geometry`).then(res => res.json())
            ).pipe(
              map(
                (arr: number[][]) => arr.map(
                  triplet => triplet.map(
                    (v, idx) => (translateMm[idx] - v) * 1e6
                  )
                )
              )
            )
          })
        )
      )
    }),
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
      map(({ region }) => !!region)
    ),
    this.TPRBbox$.pipe(
      map(({ parcellation, template }) => (
        WHITELIST_CONNECTIVITY.SPACE.includes(template?.id) && !BANLIST_CONNECTIVITY.SPACE.includes(template?.id)
      ) || (
        WHITELIST_CONNECTIVITY.PARCELLATION.includes(parcellation?.id) && !BANLIST_CONNECTIVITY.PARCELLATION.includes(parcellation?.id)
      ))
    ),
    this.expmtSvc.showExperimentalFlag$.pipe(
      switchMap(experimentalFlag => 
        this.TPRBbox$.pipe(
          map(({ parcellation, template }) => (
            WHITELIST_CONNECTIVITY.SPACE.includes(template?.id) && !BANLIST_CONNECTIVITY.SPACE.includes(template?.id)
          ) || (
            WHITELIST_CONNECTIVITY.PARCELLATION.includes(parcellation?.id) && !BANLIST_CONNECTIVITY.PARCELLATION.includes(parcellation?.id)
          ) || (
            experimentalFlag && EXPERIMENTAL_CONNECTIVITY.PARCELLATION.includes(parcellation?.id)
          ))
        )
      )
    )
  ]).pipe(
    map(flags => flags.every(f => f))
  )
  
  public totals$ = combineLatest([
    this.#catAccDirs.pipe(
      shareReplay(1),
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
      )),
    ),
    this.showConnectivity$
  ]).pipe(
    map(([ total, showConnectivityFlag ]) => {
      return total + (showConnectivityFlag ? 1 : 0)
    })
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
