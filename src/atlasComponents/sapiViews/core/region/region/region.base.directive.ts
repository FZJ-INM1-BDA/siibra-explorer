import { Directive, EventEmitter, Input, Output } from "@angular/core";
import { SxplrAtlas, SxplrParcellation, SxplrRegion, SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes";
import { translateV3Entities } from "src/atlasComponents/sapi/translateV3"
import { rgbToHsl } from 'common/util'
import { SAPI } from "src/atlasComponents/sapi/sapi.service";
import { BehaviorSubject, combineLatest, concat, EMPTY, forkJoin, from, merge, of } from "rxjs";
import { catchError, filter, map, scan, shareReplay, startWith, switchMap, take, tap } from "rxjs/operators";
import { DecisionCollapse } from "src/atlasComponents/sapi/decisionCollapse.service";
import { PathReturn } from "src/atlasComponents/sapi/typeV3";

@Directive({
  selector: `[sxplr-sapiviews-core-region]`,
  exportAs: "sapiViewsCoreRegion"
})
export class SapiViewsCoreRegionRegionBase {

  private _fetchFlag$ = new BehaviorSubject<boolean>(false)
  protected _fetchFlag = false
  #manualBusySignal$ = new BehaviorSubject(false)
  @Input('sxplr-sapiviews-core-region-detail-flag')
  set fetchFlag(val: boolean) {
    this._fetchFlag$.next(val)
    this._fetchFlag = val
  }
  get fetchFlag(){
    return this._fetchFlag
  }

  @Input('sxplr-sapiviews-core-region-atlas')
  atlas: SxplrAtlas
  @Input('sxplr-sapiviews-core-region-template')
  template: SxplrTemplate
  @Input('sxplr-sapiviews-core-region-parcellation')
  parcellation: SxplrParcellation

  @Output('sxplr-sapiviews-core-region-navigate-to')
  onNavigateTo = new EventEmitter<number[]>()

  // higher order set region
  private _region$ = new BehaviorSubject<SxplrRegion>(null)
  private _region: SxplrRegion
  @Input('sxplr-sapiviews-core-region-region')
  set region(val: SxplrRegion) {
    this._region$.next(val)
  }
  get region(){
    return this._region
  }

  private fetchDetailSignal$ = combineLatest([
    this._region$,
    this._fetchFlag$
  ]).pipe(
    switchMap(([ setRegion, fetchFlag ]) => {
      if (!setRegion) {
        return EMPTY
      }
      if (!fetchFlag) {
        return EMPTY
      }
      return of(setRegion)
    })
  )

  protected region$ = concat(
    this._region$,
    this.fetchDetailSignal$,
  ).pipe(
    switchMap(setRegion => {
      // technically the fetch detail signal should also fire when parc/template is updated
      return this.sapi.v3Get("/regions/{region_id}", {
        path: {
          region_id: setRegion.name
        },
        query: {
          parcellation_id: this.parcellation.id,
          space_id: this.template.id
        }
      }).pipe(
        switchMap(r => translateV3Entities.translateRegion(r))
      )
    }),
    catchError((err) => {
      console.warn(`Populating detail failed: ${err}`)  
      return this._region$
    })
  )
  
  public fetchInProgress$ = this.fetchDetailSignal$.pipe(
    switchMap(() => concat(
      of(true),
      this.region$.pipe(
        take(1),
        map(() => false)
      )
    )),
  )

  public readonly relatedRegions$ = this.region$.pipe(
    switchMap(region => from(this.fetchRelated(region))),
  )

  private ATP$ = new BehaviorSubject<{
    atlas: SxplrAtlas
    template: SxplrTemplate
    parcellation: SxplrParcellation
  }>(null)

  protected ATPR$ = combineLatest([
    this.ATP$,
    this.region$
  ]).pipe(
    map(([ atp, region ]) => ({ ...atp, region }))
  )

  ngOnChanges(): void {
    const { atlas, template, parcellation } = this
    this.ATP$.next({ atlas, template, parcellation })
  }

  regionRgbString$ = concat(
    of(null as string),
    this.region$.pipe(
      map(region => {
        const rgb = region?.color || [200, 200, 200]
        return `rgb(${rgb.join(',')})`
      })
    ),
  )
  regionDarkMode$ = concat(
    of(false),
    this.region$.pipe(
      filter(region => !!region),
      map(region => {
        const rgb = region.color || [200, 200, 200]
        const [ /* _h */, /* _s */, l] = rgbToHsl(...rgb)
        return l < 0.4
      })
    )
  )

  // in mm!!
  regionPosition$ = concat(
    of(null as number[]),
    this.region$.pipe(
      map(region => {
        return region?.centroid?.loc
      })
    )
  )


  navigateTo(position: number[]) {
    this.onNavigateTo.emit(position.map(v => v*1e6))
  }

  protected async fetchRelated(region: SxplrRegion){
    const getPage = (page: number) => this.sapi.v3Get("/regions/{region_id}/related", {
      path: {
        region_id: region.name
      },
      query: {
        parcellation_id: this.parcellation.id,
        page
      }
    })
    return getPage(1).pipe(
      switchMap(resp => this.sapi.iteratePages(resp, getPage)),
      switchMap(arr => forkJoin(
        arr.map(({ qualification, assigned_structure, assigned_structure_parcellation }) => forkJoin({
          qualification: of(qualification),
          region: translateV3Entities.translateRegion(assigned_structure),
          parcellation: translateV3Entities.translateParcellation(assigned_structure_parcellation),
        }))
      )),
      switchMap(relatedRegions => {
        
        const uniqueParc = relatedRegions.map(v => v.parcellation).reduce(
          (acc, curr) => acc.map(v => v.id).includes(curr.id) ? acc : acc.concat(curr),
          [] as SxplrParcellation[]
        )
        
        return forkJoin(
          uniqueParc.map(parc =>
            from(this.collapser.collapseParcId(parc.id)).pipe(
              switchMap(collapsed => forkJoin(
                collapsed.spaces.map(space =>
                  from(this.sapi.getLabelledMap(parc, space)).pipe(
                    catchError(() => of(null))
                  )
                )
              )),
              map(labelMap => ({
                parcellation: parc,
                mappedRegions: labelMap
                  .filter(v => !!v)
                  .map(m => Object.keys(m.indices))
                  .flatMap(v => v),
              })),
            )
          )
        ).pipe(
          map(allMappedRegions => {
            const regMap: Record<string, string[]> = {}
            for (const { parcellation, mappedRegions } of allMappedRegions) {
              regMap[parcellation.id] = mappedRegions
            }
            return relatedRegions.map(prev => ({
              ...prev,
              mapped: (regMap[prev.parcellation.id] || []).includes(prev.region.name)
            }))
          })
        )
      })
    ).toPromise()
  }

  constructor(protected sapi: SAPI, private collapser: DecisionCollapse){

  }

  
  private regionalMaps$ = this.ATPR$.pipe(
    tap(() => this.#manualBusySignal$.next(true)),
    switchMap(({ parcellation, template, region }) =>
      concat(
        of([] as PathReturn<"/maps/{map_id}">[]),
        this.sapi.getMaps(parcellation.id, template.id).pipe(
          switchMap(maps =>
            merge(
              ...maps.map(m => this.sapi.getMap(m["@id"]))
            )
          ),
          scan((acc, curr) => ([...acc, curr]), [] as PathReturn<"/maps/{map_id}">[]),
          map(maps => {
            // while it is possible to distinguish statistical vs labelled maps
            // it is not advised to do so for presenting dois for the following reasons:
            //
            // 1. we fetch statistical/labelled map info in parallel, labelled map info returns first
            // --> we have to try to fetch both, since we do not know if the current selection has statistical map or not
            // 2a. we show labelled map doi. When/if statistical map doi shows up, we hot swap it
            // --> sudden change of UI, highly discouraged (almost bait and switch)
            // 2b. we wait until **both** calls return
            // --> user could be waiting for a long time, staring at a spinner
            return maps.map(m => {
              const indices = m.indices[region.name] || []
              return indices
                .map(index => m.volumes[index.volume || 0])
                .filter(v => !!v)
            }).flat()
          }),
        ),
      ),
    ),
    tap(() => this.#manualBusySignal$.next(false)), 
    shareReplay(1),
  )

  #rankeddataset$ = this.regionalMaps$.pipe(
    map(sms => {
      const allDatasets: PathReturn<"/maps/{map_id}">['datasets'][number][] = []
      for (const sm of sms){
        allDatasets.push(...sm.datasets)
      }
      allDatasets.sort((a, b) => {
        const urldiff = a.urls.length - b.urls.length
        if (urldiff !== 0) return urldiff * -1
        const descdiff = (a.description ? 1 : 0) - (b.description ? 1 : 0)
        if (descdiff !== 0) return descdiff * -1
        const authordiff = (a.contributors.length ? 1 : 0) - (b.contributors.length ? 1 : 0 )
        if (authordiff !== 0) return authordiff * -1
        return a > b ? -1 : 1
      })
      return allDatasets
    }),
    startWith([] as PathReturn<"/maps/{map_id}">['datasets'][number][]),
    shareReplay(1),
  )
  
  public dois$ = this.#rankeddataset$.pipe(
    map(dss => {
      
      const returnUrls: string[] = []

      for (const ds of dss) {
        for (const url of ds.urls) {
          returnUrls.push(url.url)
        }
        
      }
      return returnUrls
    })
  )

  public desc$ = this.#rankeddataset$.pipe(
    map(dss => {
      for (const ds of dss){
        if (ds.description) {
          return ds.description
        }
      }
    }),
  )
  public contributors$ = this.#rankeddataset$.pipe(
    map(dss => {
      for (const ds of dss) {
        if (ds.contributors) {
          return ds.contributors.map(c => c.name)
        }
      }
    }),
  )
}
