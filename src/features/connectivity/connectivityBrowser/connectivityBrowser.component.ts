import {  Component, ElementRef, ViewChild, Input, SimpleChanges, HostListener, OnChanges, inject } from "@angular/core";
import { Store, select} from "@ngrx/store";
import { BehaviorSubject, combineLatest, merge, concat, NEVER} from "rxjs";
import { switchMap, map, shareReplay, distinctUntilChanged, withLatestFrom, filter, finalize, debounceTime, takeUntil } from "rxjs/operators";
import { atlasAppearance, atlasSelection } from "src/state";
import { SAPI } from "src/atlasComponents/sapi/sapi.service";
import { of } from "rxjs";
import { SxplrAtlas, SxplrParcellation, SxplrRegion, SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes";
import { actions } from "src/state/atlasSelection";
import { translateV3Entities } from "src/atlasComponents/sapi/translateV3";
import { DS } from "src/features/filterCategories.pipe";
import { FormControl, FormGroup } from "@angular/forms";
import { PathReturn } from "src/atlasComponents/sapi/typeV3";
import { arrayEqual } from "src/util/array";
import { switchMapWaitFor } from "src/util/fn";
import { DestroyDirective } from "src/util/directives/destroy.directive";
import { CONST } from "common/constants"

type PathParam = DS['value'][number]
type ConnFeat = PathReturn<"/feature/RegionalConnectivity/{feature_id}">

@Component({
  selector: 'sxplr-features-connectivity-browser',
  templateUrl: './connectivityBrowser.template.html',
  styleUrls: ['./connectivityBrowser.style.scss'],
  hostDirectives: [
    DestroyDirective
  ]
})
export class ConnectivityBrowserComponent implements OnChanges {

  CONST = CONST

  #destroy$ = inject(DestroyDirective).destroyed$

  @Input('sxplr-features-connectivity-browser-atlas')
  atlas: SxplrAtlas

  @Input('sxplr-features-connectivity-browser-template')
  template: SxplrTemplate

  @Input('sxplr-features-connectivity-browser-parcellation')
  parcellation: SxplrParcellation

  parcellation$ = new BehaviorSubject<SxplrParcellation>(null)

  #accordionExpanded$ = new BehaviorSubject<boolean>(null)
  @Input()
  set accordionExpanded(flag: boolean) {
    this.#accordionExpanded$.next(flag)
  }
  
  region$ = new BehaviorSubject<SxplrRegion>(null)
  @Input()
  set region(region: SxplrRegion) {
    this.region$.next(region)
  }

  types$ = new BehaviorSubject<PathParam[]>(null)
  @Input()
  types: PathParam[]

  connectivityFilterForm = new FormGroup({
    selectedType: new FormControl<PathParam>(null),
    selectedView: new FormControl<'average'|'subject'>('subject'),
    selectedCohort: new FormControl<string>(null),
    selectedDatasetIndex: new FormControl<number>(0),
    selectedSubjectIndex: new FormControl<number>(0),
  })

  displayForm = new FormGroup({
    logChecked: new FormControl<boolean>(false)
  })

  formValue$ = this.connectivityFilterForm.valueChanges.pipe(
    debounceTime(160),
    shareReplay(1),
  )

  static LayerId = 'connectivity-colormap-id'

  @ViewChild('connectivityComponent') public connectivityComponentElement: ElementRef<any>
  @ViewChild('fullConnectivityGrid') public fullConnectivityGridElement: ElementRef<any>

  constructor(
    private store$: Store,
    protected sapi: SAPI
  ) {
    /**
     * on accordion expansion, if nothing is selected, select default (0) type
     */
    combineLatest([
      this.#accordionExpanded$,
      this.types$,
      concat(
        of(null as PathParam),
        this.formValue$.pipe(
          map(v => v.selectedType),
          distinctUntilChanged((n, o) => n.name === o.name)
        )
      ),
    ]).pipe(
      takeUntil(this.#destroy$),
    ).subscribe(([flag, types, selectedType]) => {
      if (flag && !selectedType) {
        this.connectivityFilterForm.patchValue({
          selectedType: types[0]
        })
      }
    })
    
    /**
     * on set log
     */
    this.displayForm.valueChanges.pipe(
      map(v => v.logChecked),
      switchMap(switchMapWaitFor({
        condition: () => !!this.connectivityComponentElement,
        leading: true
      })),
      takeUntil(this.#destroy$)
    ).subscribe(flag => {
      const el = this.connectivityComponentElement
      el.nativeElement.setShowLog(flag)
    })

    /**
     * on type selection, select first cohort
     */
    this.formValue$.pipe(
      map(v => v.selectedType),
      distinctUntilChanged((n, o) => n.name === o.name),
      switchMap(() =>
        this.cohorts$.pipe(
          /**
           * it's important to not use distinctUntilChanged
           * new corhots emit should always trigger this flow
           */
        )
      ),
      takeUntil(this.#destroy$)
    ).subscribe(cohorts => {
      if (cohorts.length > 0) {
        this.connectivityFilterForm.patchValue({
          selectedCohort: cohorts[0]
        })
      }
    })

    /**
     * on select cohort
     */
    this.selectedCohort$.pipe(
      switchMap(() => this.cohortDatasets$.pipe(
        map(dss => dss.length),
        distinctUntilChanged(),
        filter(length => length > 0),
      )),
      takeUntil(this.#destroy$)
    ).subscribe(() => {
      this.connectivityFilterForm.patchValue({
        selectedDatasetIndex: 0,
        selectedSubjectIndex: 0,
      })
    })

    /**
     * on update colormap, add new custom layer
     */
    combineLatest([
      this.#accordionExpanded$,
      this.colormap$,
    ]).pipe(
      withLatestFrom(
        this.store$.pipe(
          select(atlasSelection.selectors.selectedParcAllRegions)
        )
      ),
      takeUntil(this.#destroy$)
    ).subscribe(([[accordionExpanded, conn], allregions]) => {
      if (!accordionExpanded || !conn) {
        return
      }

      const map = new Map<SxplrRegion, number[]>()
      for (const region of allregions) {
        const area = conn.find(a => a.name === region.name)
        if (area) {
          map.set(region, Object.values(area.color))
        } else {
          map.set(region, [255,255,255,0.1])
        }
      }
      
      this.store$.dispatch(
        atlasAppearance.actions.addCustomLayers({
          customLayers: [{
            clType: 'customlayer/colormap',
            id: ConnectivityBrowserComponent.LayerId,
            colormap: map
          }]
        })
      )
    })

    /**
     * on
     * - accordion update
     * - colormap change
     * - fetching matrix flag is true
     * remove custom layer
     */
    merge(
      this.#accordionExpanded$.pipe(
        filter(expanded => !expanded),
      ),
      this.#fetchingMatrix$.pipe(
        filter(flag => !!flag),
      ),
    ).pipe(
      takeUntil(this.#destroy$),
    ).subscribe(() => {
      this.removeCustomLayer()
    })

    /**
     * on pure connection update, update logchecked box
     */
    this.#pureConnections$.pipe(
      takeUntil(this.#destroy$)
    ).subscribe(v => {
      if (!v) return
      for (const val of Object.values(v)) {
        if (val > 1) {
          this.displayForm.get("logChecked").enable()
          return
        }
      }
      this.displayForm.get("logChecked").patchValue(false)
      this.displayForm.get("logChecked").disable()
    })

    this.selectedDataset$.pipe(
      takeUntil(this.#destroy$)
    ).subscribe(selectedDs => {
      this.selectedDataset = selectedDs
    })

    this.#destroy$.subscribe({
      complete: () => {
        this.removeCustomLayer()
      }
    })
  }

  selectedDataset: PathReturn<"/feature/RegionalConnectivity/{feature_id}">

  public ngOnChanges(changes: SimpleChanges): void {
    const { parcellation, types } = changes
    if (parcellation) {
      this.parcellation$.next(parcellation.currentValue)
    }
    if (types) [
      this.types$.next(types.currentValue)
    ]
  }

  removeCustomLayer() {
    this.store$.dispatch(
      atlasAppearance.actions.removeCustomLayers({
        customLayers: [{id: ConnectivityBrowserComponent.LayerId}]
      })
    )
  }

  busy$ = new BehaviorSubject<boolean>(false)

  #selectedType$ = this.formValue$.pipe(
    map(v => v.selectedType),
    distinctUntilChanged((o, n) => o?.name === n?.name),
    shareReplay(1),
  )

  #connFeatures$ = this.parcellation$.pipe(
    switchMap(parc => concat(
      of(null as PathParam),
      this.#selectedType$,
    ).pipe(
      switchMap(selectedType => {
        if (!selectedType || !parc) {
          return of([] as ConnFeat[])
        }

        const typedName = getType(selectedType.name)
        const query = {
          parcellation_id: parc.id,
          type: typedName
        }
        this.busy$.next(true)
        return concat(
          of(
            [] as PathReturn<"/feature/RegionalConnectivity/{feature_id}">[],
          ),
          this.sapi.v3Get(
            "/feature/RegionalConnectivity",
            { query }
          ).pipe(
            switchMap(resp =>
              this.sapi.iteratePages(
                resp,
                page => this.sapi.v3Get(
                  "/feature/RegionalConnectivity",
                  { query: { ...query, page } }
                )
              )
            ),
            finalize(() => {
              this.busy$.next(false)
            })
          )
        )
      })
    )),
  )

  cohorts$ = this.#connFeatures$.pipe(
    map(v => {
      const cohorts: string[] = []
      for (const item of v) {
        if (!cohorts.includes(item.cohort)) {
          cohorts.push(item.cohort)
        }
      }
      return cohorts
    })
  )

  selectedCohort$ = this.formValue$.pipe(
    map(v => v.selectedCohort),
    distinctUntilChanged()
  )

  cohortDatasets$ = combineLatest([
    this.#connFeatures$,
    this.formValue$.pipe(
      map(v => v.selectedCohort),
      distinctUntilChanged()
    ),
  ]).pipe(
    map(([ features, selectedCohort ]) => features.filter(f => f.cohort === selectedCohort)),
    distinctUntilChanged(
      arrayEqual((o, n) => o?.id === n?.id)
    ),
    shareReplay(1),
  )

  selectedDataset$ = this.cohortDatasets$.pipe(
    switchMap(features => this.formValue$.pipe(
      map(v => v.selectedDatasetIndex),
      distinctUntilChanged(),
      map(dsIdx =>  features[dsIdx]),
      shareReplay(1),
    )),
  )

  selectedDatasetAdditionalInfos$ = this.selectedDataset$.pipe(
    map(ds => ds ? ds.datasets : [])
  )

  #fetchingMatrix$ = new BehaviorSubject<boolean>(false)

  #matrixInput$ = combineLatest([
    this.parcellation$,
    this.formValue$,
    this.cohortDatasets$,
  ]).pipe(
    map(([ parcellation, form, dss ]) => {
      const {
        selectedDatasetIndex: dsIdx,
        selectedSubjectIndex: subIdx,
        selectedView
      } = form
      const ds = dss[dsIdx]
      if (!ds) {
        return null
      }

      const subject = ds.subjects[subIdx]
      if (!subject) {
        return null
      }
      return {
        parcellation,
        feature_id: ds.id,
        subject,
        selectedView
      }
    }),
    distinctUntilChanged((o, n) => o?.feature_id === n?.feature_id && o?.subject === n?.subject && o?.selectedView === n?.selectedView && o?.parcellation?.id === n?.parcellation?.id),
    shareReplay(1),
  )

  #selectedMatrix$ = this.#matrixInput$.pipe(
    switchMap(input => {
      if (!input) {
        return NEVER
      }
      const { parcellation, feature_id, subject } = input
      
      this.#fetchingMatrix$.next(true)
      return this.sapi.v3Get(
        "/feature/RegionalConnectivity/{feature_id}",
        {
          query: {
            parcellation_id: parcellation.id,
            ...(input.selectedView === "average"
            ? {}
            : { subject })
          },
          path: {
            feature_id
          }
        }
      ).pipe(
        finalize(() => {
          this.#fetchingMatrix$.next(false)
        })
      )
    }),
    shareReplay(1),
  )

  #pureConnections$ = this.#matrixInput$.pipe(
    switchMap(matrixInput =>
      this.#selectedMatrix$.pipe(
        withLatestFrom(this.region$),
        map(([ v, region ]) => {
          const matrixKey = matrixInput?.selectedView === "average" ? "_average" : matrixInput?.subject
          if (!v || !matrixInput || !v.matrices?.[matrixKey]) {
            return null
          }
          const b = v.matrices[matrixKey]
          const foundIdx = b.columns.findIndex(v => v['name'] === region.name)
          if (typeof foundIdx !== 'number') {
            return null
          }
          const profile = b.data[foundIdx]
          if (!profile) {
            return null
          }
          const rObj: Record<string, number> = {}
          b.columns.reduce((acc, curr, idx) => {
            const rName = curr['name'] as string
            acc[rName] = profile[idx] as number
            return acc
          }, rObj)
          return rObj
        })
      ),
    ),
  )

  colormap$ = this.#matrixInput$.pipe(
    switchMap(() => concat(
      of(null as ConnectedArea[]),
      combineLatest([
        this.#pureConnections$,
        this.displayForm.valueChanges.pipe(
          map(v => v.logChecked),
          distinctUntilChanged()
        )
      ]).pipe(
        filter(conn => !!conn),
        map(([ conn, flag ]) => processProfile(conn, flag))
      )
    ))
  )
  
  view$ = combineLatest([
    this.busy$,
    this.selectedDataset$,
    this.formValue$,
    this.#fetchingMatrix$,
    concat(
      of(null as Record<string, number>),
      this.#pureConnections$,
    ),
    this.region$,
  ]).pipe(
    map(([busy, sDs, form, fetchingMatrix, pureConnections, region]) => {
      return {
        showSubject: sDs && form.selectedView === "subject",
        numSubjects: sDs?.subjects.length,
        connections: pureConnections,
        region,
        showAverageToggle: form.selectedCohort !== null && typeof form.selectedCohort !== "undefined",
        busy: busy || fetchingMatrix,
        selectedSubject: (sDs?.subjects || [])[form.selectedSubjectIndex],
        selectedDataset: form?.selectedDatasetIndex
      }
    }),
    shareReplay(1),
  )

  @HostListener('connectedRegionClicked', ['$event'])
  onRegionClicked(event: CustomEvent) {
    const regionName = event.detail.name as string
    this.sapi.v3Get("/regions/{region_id}", {
      path: {region_id: regionName},
      query: {
        parcellation_id: this.parcellation.id,
        space_id: this.template.id
      }
    }).pipe(
      switchMap(r => translateV3Entities.translateRegion(r))
    ).subscribe(region => {
      const centroid = region.centroid?.loc
      if (centroid) {
        this.store$.dispatch(
          actions.navigateTo({
            navigation: {
              position: centroid.map(v => v*1e6),
            },
            animation: true
          })
        )
      }
    })
  }

  exportConnectivityProfile() {
    const a = document.querySelector('hbp-connectivity-matrix-row');
    (a as any).downloadCSV()
  }

  public exportFullConnectivity() {
    this.fullConnectivityGridElement?.nativeElement['downloadCSV']()
  }
}

function clamp(min: number, max: number) {
  return function(val: number) {
    return Math.max(min, Math.min(max, val))
  }
}
const clamp01 = clamp(0, 1)
function interpolate255(val: number) {
  return Math.round(clamp01(val) * 255)
}
function jet(val: number) {
  return {
    r: val < 0.7 
      ? interpolate255(4 * val - 1.5)
      : interpolate255(-4.0 * val + 4.5),
    g: val < 0.5
      ? interpolate255(4.0 * val - 0.5)
      : interpolate255(-4.0 * val + 3.5),
    b: val < 0.3
      ? interpolate255(4.0 * val + 0.5)
      : interpolate255(-4.0 * val + 2.5)
  }
}

function processProfile(areas: Record<string, number>, logFlag=false): ConnectedArea[] {
  const returnValue: Omit<ConnectedArea, "color">[] = []
  for (const areaname in areas) {
    returnValue.push({
      name: areaname,
      numberOfConnections: areas[areaname],
    })
  }
  returnValue.sort((a, b) => b.numberOfConnections - a.numberOfConnections)
  if (returnValue.length === 0) {
    return []
  }
  const preprocess = (v: number) => logFlag ? Math.log10(v) : v
  return returnValue.map(v => ({
    ...v,
    color: jet(
      preprocess(v.numberOfConnections) / preprocess(returnValue[0].numberOfConnections)
    )
  }))
}

function getType(name: string) {
  return name.split(".").slice(-1)[0]
}

type ConnectedArea = {
    color: {r: number, g: number, b: number}
    name: string
    numberOfConnections: number
}
