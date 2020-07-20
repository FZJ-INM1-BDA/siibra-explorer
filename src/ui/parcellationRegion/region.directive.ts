import { Directive } from "@angular/core";
import { RegionBase } from "./region.base";
import { Store } from "@ngrx/store";

@Directive({
  selector: '[iav-region]',
  exportAs: 'iavRegion'
})

export class RegionDirective extends RegionBase{
  constructor(store: Store<any>){
    super(store)
  }
}
