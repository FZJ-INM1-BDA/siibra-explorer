import { Directive, OnChanges, SimpleChanges } from "@angular/core";
import { BehaviorSubject, merge, Observable } from "rxjs";
import { switchMap,  filter, startWith, shareReplay, mapTo, delay, tap } from "rxjs/operators";
import { SAPI, SapiAtlasModel, SapiParcellationModel, SapiRegionalFeatureModel, SapiRegionModel, SapiSpaceModel } from "src/atlasComponents/sapi";
import { SapiViewsCoreRegionRegionBase } from "./region.base.directive";

@Directive({
  selector: '[sxplr-sapiviews-core-region-regional-feature]',
  exportAs: 'sapiViewsRegionalFeature'
})

export class SapiViewsCoreRegionRegionalFeatureDirective extends SapiViewsCoreRegionRegionBase implements OnChanges{

  private ATPR$ = new BehaviorSubject<{
    atlas: SapiAtlasModel
    template: SapiSpaceModel
    parcellation: SapiParcellationModel
    region: SapiRegionModel
  }>(null)

  ngOnChanges(sc: SimpleChanges): void {
    const { atlas, template, parcellation, region } = this
    this.ATPR$.next({ atlas, template, parcellation, region })
  }

  constructor(sapi: SAPI){
    super(sapi)
  }

  private features$: Observable<SapiRegionalFeatureModel[]> = this.ATPR$.pipe(
    filter(arg => {
      if (!arg) return false
      const { atlas, parcellation, region, template } = arg
      return !!atlas && !!parcellation && !!region && !!template 
    }),
    switchMap(({ atlas, parcellation, region, template }) => this.sapi.getRegionFeatures(atlas["@id"], parcellation["@id"], template["@id"], region.name)),
  )

  public listOfFeatures$: Observable<SapiRegionalFeatureModel[]> = this.features$.pipe(
    startWith([]),
    shareReplay(1),
  )

  public busy$: Observable<boolean> = merge(
    this.ATPR$.pipe(
      mapTo(true)    
    ),
    this.features$.pipe(
      mapTo(false)
    )
  )
}
