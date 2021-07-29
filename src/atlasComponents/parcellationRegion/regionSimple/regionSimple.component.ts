import { Component } from '@angular/core'

import { Store } from '@ngrx/store'
import { IavRootStoreInterface } from 'src/services/stateStore.service'
import { RegionBase } from '../region.base'

@Component({
  selector: 'simple-region',
  templateUrl: './regionSimple.template.html',
  styleUrls: [
    './regionSimple.style.css',
  ],
})

export class SimpleRegionComponent extends RegionBase {
  constructor(
    store$: Store<IavRootStoreInterface>,
  ) {
    super(store$)
  }
}
