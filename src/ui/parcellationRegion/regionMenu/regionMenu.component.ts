import { Component } from "@angular/core";
import { Store } from "@ngrx/store";

import { RegionBase } from '../region.base'

@Component({
  selector: 'region-menu',
  templateUrl: './regionMenu.template.html',
  styleUrls: ['./regionMenu.style.css']
})
export class RegionMenuComponent extends RegionBase {

constructor(store$: Store<any>) {
  super(store$)
  }
}