import { Directive, EventEmitter, Input, Output } from "@angular/core";
import { SxplrAtlas, SxplrParcellation, SxplrRegion, SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes";
import { translateV3Entities } from "src/atlasComponents/sapi/translateV3"
import { rgbToHsl } from 'common/util'
import { SAPI } from "src/atlasComponents/sapi/sapi.service";
import { BehaviorSubject, combineLatest, forkJoin, from, of } from "rxjs";
import { catchError, map, switchMap } from "rxjs/operators";
import { DecisionCollapse } from "src/atlasComponents/sapi/decisionCollapse.service";

@Directive({
  selector: `[sxplr-sapiviews-core-region]`,
  exportAs: "sapiViewsCoreRegion"
})
export class SapiViewsCoreRegionRegionBase {

  @Input('sxplr-sapiviews-core-region-detail-flag')
  shouldFetchDetail = false

  public fetchInProgress$ = new BehaviorSubject<boolean>(false)

  @Input('sxplr-sapiviews-core-region-atlas')
  atlas: SxplrAtlas
  @Input('sxplr-sapiviews-core-region-template')
  template: SxplrTemplate
  @Input('sxplr-sapiviews-core-region-parcellation')
  parcellation: SxplrParcellation

  @Output('sxplr-sapiviews-core-region-navigate-to')
  onNavigateTo = new EventEmitter<number[]>()

  protected region$ = new BehaviorSubject<SxplrRegion>(null)
  private _region: SxplrRegion
  @Input('sxplr-sapiviews-core-region-region')
  set region(val: SxplrRegion) {
    this.region$.next(val)

    if (!this.shouldFetchDetail || !val) {
      this._region = val
      this.setupRegionDarkmode()
      return
    }
    this.fetchInProgress$.next(true)
    this._region = null
    
    this.fetchDetail(val)
      .then(r => {
        this._region = r
      })
      .catch(e => {
        console.warn(`populating detail failed.`, e)
        this._region = val
      })
      .finally(() => {
        this.fetchInProgress$.next(false)
        this.setupRegionDarkmode()
      })
  }
  get region(){
    return this._region
  }

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

  regionRgbString: string = `rgb(200, 200, 200)`
  regionDarkmode = false
  // in mm!!
  regionPosition: number[] = null
  dois: string[] = []

  protected setupRegionDarkmode(){

    this.regionRgbString = `rgb(200, 200, 200)`
    this.regionDarkmode = false
    this.regionPosition = null
    this.dois = []

    if (this.region) {

      /**
       * color
       */
      const rgb = this.region?.color || [200, 200, 200]
      this.regionRgbString = `rgb(${rgb.join(',')})`
      const [ /* _h */, /* _s */, l] = rgbToHsl(...rgb)
      this.regionDarkmode = l < 0.4
      
      /**
       * position
       */
      this.regionPosition = this.region.centroid?.loc

      /**
       * dois
       */
      this.dois = (this.region.link || []).map(link => link.href)
    }
  }

  navigateTo(position: number[]) {
    this.onNavigateTo.emit(position.map(v => v*1e6))
  }

  protected async fetchDetail(region: SxplrRegion): Promise<SxplrRegion> {
    return this.sapi.v3Get("/regions/{region_id}", {
      path: {
        region_id: region.name
      },
      query: {
        parcellation_id: this.parcellation.id,
        space_id: this.template.id
      }
    }).pipe(
      switchMap(r => translateV3Entities.translateRegion(r))
    ).toPromise()
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
}
