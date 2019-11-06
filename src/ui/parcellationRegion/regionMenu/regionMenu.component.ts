import { Component } from "@angular/core";
import { Store } from "@ngrx/store";

import { RegionBase } from '../region.base'
import { IavRootStoreInterface } from "src/services/stateStore.service";

@Component({
  selector: 'region-menu',
  templateUrl: './regionMenu.template.html',
  styleUrls: ['./regionMenu.style.css']
})
export class RegionMenuComponent extends RegionBase {

constructor(
  store$: Store<IavRootStoreInterface>
) {
  super(store$)
  }
}