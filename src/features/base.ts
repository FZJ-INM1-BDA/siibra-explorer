import { Input, OnChanges, Directive } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { SxplrParcellation, SxplrRegion, SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes";

@Directive()
export class FeatureBase implements OnChanges{
    
  @Input()
  template: SxplrTemplate

  @Input()
  parcellation: SxplrParcellation

  @Input()
  region: SxplrRegion

  @Input()
  queryParams: Record<string, string> = {}
  
  protected TPR$ = new BehaviorSubject<{ template?: SxplrTemplate, parcellation?: SxplrParcellation, region?: SxplrRegion }>({ template: null, parcellation: null, region: null })

  ngOnChanges(): void {
    const { template, parcellation, region } = this
    this.TPR$.next({ template, parcellation, region })
  }
}



export const AllFeatures = {
  CorticalProfile: "CorticalProfile",
  // EbrainsDataFeature: "EbrainsDataFeature",
  RegionalConnectivity: "RegionalConnectivity",
  Tabular: "Tabular",
  // GeneExpressions: "GeneExpressions",
  Image: "Image",
} as const