import { Component, Input } from "@angular/core";

import { Store } from "@ngrx/store";
import { IavRootStoreInterface } from "src/services/stateStore.service";
import { RegionBase } from '../region.base'

@Component({
  selector: 'region-list-simple-view',
  templateUrl: './regionListSimpleView.template.html',
  styleUrls: [
    './regionListSimpleView.style.css',
  ],
})

export class RegionListSimpleViewComponent extends RegionBase {

  @Input()
  public showBrainIcon: boolean = false

  @Input()
  public showDesc: boolean = false

  constructor(
    store$: Store<IavRootStoreInterface>,
  ) {
    super(store$)
  }
}
