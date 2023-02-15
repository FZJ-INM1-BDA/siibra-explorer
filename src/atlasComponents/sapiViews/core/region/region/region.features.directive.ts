import { Directive, OnChanges, SimpleChanges } from "@angular/core";
import { BehaviorSubject, merge } from "rxjs";
import { switchMap,  filter, startWith, shareReplay, scan } from "rxjs/operators";
import { SAPI, SAPIRegion } from "src/atlasComponents/sapi";
import { SxplrAtlas, SxplrParcellation, SxplrTemplate, SxplrRegion } from "src/atlasComponents/sapi/type_sxplr"
import { SapiViewsCoreRegionRegionBase } from "./region.base.directive";

@Directive({
  selector: '[sxplr-sapiviews-core-region-regional-feature]',
  exportAs: 'sapiViewsRegionalFeature'
})

export class SapiViewsCoreRegionRegionalFeatureDirective extends SapiViewsCoreRegionRegionBase implements OnChanges{

  private ATPR$ = new BehaviorSubject<{
    atlas: SxplrAtlas
    template: SxplrTemplate
    parcellation: SxplrParcellation
    region: SxplrRegion
  }>(null)

  ngOnChanges(sc: SimpleChanges): void {
    const { atlas, template, parcellation, region } = this
    this.ATPR$.next({ atlas, template, parcellation, region })
  }

  constructor(sapi: SAPI){
    super(sapi)
  }

  private features$ = this.ATPR$.pipe(
    filter(arg => {
      if (!arg) return false
      const { atlas, parcellation, region, template } = arg
      return !!atlas && !!parcellation && !!region && !!template 
    }),
    switchMap(({ atlas, parcellation, region, template }) => {
      this.busy$.next(true)
      const parcId = parcellation["@id"]
      const regionId = region.name
      const atlasId = atlas["@id"]
      const reg = this.sapi.getRegion(atlasId, parcId, regionId)
      return SAPIRegion.Features$.pipe(
        switchMap(features => merge(
          ...features.map(
            feature => reg.getFeatures(
              feature,
              {
                query: {
                  parcellation_id: parcId,
                  region_id: regionId,
                },
                priority: 1
              }
            )
          )
        )),
        scan((acc, curr) => [...acc, ...curr.items], [])
      )
    }),
  )

  public listOfFeatures$ = this.features$.pipe(
    startWith([]),
    shareReplay(1),
  )

  public busy$ = new BehaviorSubject<boolean>(false)
}
