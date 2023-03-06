import { Directive, OnChanges, SimpleChanges } from "@angular/core";
import { BehaviorSubject, merge, NEVER } from "rxjs";
import { switchMap,  filter, startWith, shareReplay, scan } from "rxjs/operators";
import { SAPI, SAPIRegion } from "src/atlasComponents/sapi";
import { SxplrAtlas, SxplrParcellation, SxplrTemplate, SxplrRegion } from "src/atlasComponents/sapi/sxplrTypes"
import { SapiViewsCoreRegionRegionBase } from "./region.base.directive";

@Directive({
  selector: '[sxplr-sapiviews-core-region-regional-feature]',
  exportAs: 'sapiViewsRegionalFeature'
})

export class SapiViewsCoreRegionRegionalFeatureDirective extends SapiViewsCoreRegionRegionBase implements OnChanges{

  constructor(sapi: SAPI){
    super(sapi)
  }

  private features$ = NEVER

  public listOfFeatures$ = this.features$.pipe(
    startWith([]),
    shareReplay(1),
  )

  public busy$ = new BehaviorSubject<boolean>(false)
}
