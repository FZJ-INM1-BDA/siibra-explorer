import { Input, OnChanges, Directive, SimpleChanges } from "@angular/core";
import { BehaviorSubject, combineLatest } from "rxjs";
import { debounceTime, map } from "rxjs/operators";
import { SxplrParcellation, SxplrRegion, SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes";

type BBox = [[number, number, number], [number, number, number]]

@Directive()
export class FeatureBase implements OnChanges{
    
  @Input()
  template: SxplrTemplate

  @Input()
  parcellation: SxplrParcellation

  @Input()
  region: SxplrRegion

  @Input()
  bbox: BBox

  @Input()
  queryParams: Record<string, string> = {}
  
  #TPR$ = new BehaviorSubject<{ template?: SxplrTemplate, parcellation?: SxplrParcellation, region?: SxplrRegion }>({ template: null, parcellation: null, region: null })
  #bbox$ = new BehaviorSubject<{ bbox?: BBox }>({ bbox: null })
  protected TPRBbox$ = combineLatest([
    this.#TPR$,
    this.#bbox$.pipe(
      debounceTime(500)
    )
  ]).pipe(
    map(([ v1, v2 ]) => ({ ...v1, ...v2 }))
  )

  ngOnChanges(sc: SimpleChanges): void {
    const { template, parcellation, region, bbox } = sc
    if (bbox) {
      this.#bbox$.next({ bbox: bbox.currentValue })
    }
    if (template || parcellation || region) {
      const { template: t, parcellation: p, region: r } = this
      this.#TPR$.next({
        template: template?.currentValue || t,
        parcellation: parcellation?.currentValue || p,
        region: region?.currentValue || r
      })
    }
  }
}



export const AllFeatures = {
  CorticalProfile: "CorticalProfile",
  EbrainsDataFeature: "EbrainsDataFeature",
  RegionalConnectivity: "RegionalConnectivity",
  Tabular: "Tabular",
  // GeneExpressions: "GeneExpressions",
  Image: "Image",
} as const