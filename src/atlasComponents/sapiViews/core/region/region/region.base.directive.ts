import { Directive, EventEmitter, Input, Output } from "@angular/core";
import { SxplrAtlas, SxplrParcellation, SxplrRegion, SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes";
import { translateV3Entities } from "src/atlasComponents/sapi/translateV3"
import { rgbToHsl } from 'common/util'
import { SAPI } from "src/atlasComponents/sapi/sapi.service";
import { BehaviorSubject, combineLatest, concat, EMPTY, forkJoin, from, of } from "rxjs";
import { catchError, filter, map, shareReplay, switchMap, take } from "rxjs/operators";
import { DecisionCollapse } from "src/atlasComponents/sapi/decisionCollapse.service";
import { PathReturn } from "src/atlasComponents/sapi/typeV3";

@Directive({
  selector: `[sxplr-sapiviews-core-region]`,
  exportAs: "sapiViewsCoreRegion"
})
export class SapiViewsCoreRegionRegionBase {

  private _fetchFlag$ = new BehaviorSubject<boolean>(false)
  protected _fetchFlag = false
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
  
  protected regionalMaps$ = this.ATPR$.pipe(
    switchMap(({ parcellation, template, region }) =>
      concat(
        of([] as PathReturn<"/map">["volumes"]),
        this.sapi.getMap(parcellation.id, template.id, "STATISTICAL").pipe(
          map(v => {
            const mapIndices = v.indices[region.name]
            return mapIndices.map(mapIdx => v.volumes[mapIdx.volume])
          }),
          catchError((_err, _obs) => {
            /**
             * if statistical map somehow fails to fetch (e.g. does not exist for this combination 
             * of parc tmpl), fallback to labelled map
             */
            return this.sapi.getMap(parcellation.id, template.id, "LABELLED").pipe(
              map(v => {
                const mapIndices = v.indices[region.name]
                return (mapIndices || []).map(mapIdx => v.volumes[mapIdx.volume])
              })
            )
          })
        ),
      )
    ),
    shareReplay(1)
  )

  public dois$ = combineLatest([
    this.regionalMaps$.pipe(
      map(sms => {
        const returnUrls: string[] = []
        for (const sm of sms) {
          for (const ds of sm.datasets) {
            for (const url of ds.urls) {
              returnUrls.push(url.url)
            }
            
          }
        }
        return returnUrls
      })
    ),
    concat(
      of([] as string[]),
      this.region$.pipe(
        map(region => (region.link || []).map(l => l.href))
      )
    )
  ]).pipe(
    map(([ doisFromMap, doisFromRegion ]) => [...doisFromMap, ...doisFromRegion])
  )

  public desc$ = this.regionalMaps$.pipe(
    map(sm => {
      for (const ds of (sm?.[0]?.datasets) || []) {
        if (ds.description) {
          return ds.description
        }
      }
    }),
  )

  public contributors$ = this.regionalMaps$.pipe(
    map(sm => sm.flatMap(f => f.datasets.flatMap(ds => ds.contributors.map(c => c.name))))
  )

}
