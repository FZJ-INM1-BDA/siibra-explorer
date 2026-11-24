import { Directive, input, Input, OnChanges, SimpleChanges } from "@angular/core";
import { TPBRCategoryDirective } from "./tpbrCategory.directive";
import { SAPI } from "src/atlasComponents/sapi";
import { switchMap } from "rxjs/operators";
import { merge } from "rxjs";
import { SxplrRegion } from "src/atlasComponents/sapi/sxplrTypes";

@Directive({
  selector: '[dataset-aggregator]',
  exportAs: 'datasetAggregator',
  standalone: true,
})

export class DatasetAggregator extends TPBRCategoryDirective implements OnChanges{
  
  selectedRegions = input<SxplrRegion[]>([], { alias: 'selected-regions' })

  constructor(sapi: SAPI){
    super(sapi)
  }

  ngOnChanges(sc: SimpleChanges): void {
    if (this.selectedRegions().length > 0) {
      this.region = this.selectedRegions()[0]
    } else {
      this.region = this.parcellation as any
    }
    super.ngOnChanges(sc)
  }

}
