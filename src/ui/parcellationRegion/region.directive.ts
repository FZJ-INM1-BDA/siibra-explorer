import { Directive } from "@angular/core";
import { RegionBase } from "./region.base";

@Directive({
  selector: '[iav-region]',
  exportAs: 'iavRegion'
})

export class RegionDirective extends RegionBase{

}
