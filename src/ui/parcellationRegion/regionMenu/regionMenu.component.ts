import { Component, OnDestroy } from "@angular/core";
import { Store } from "@ngrx/store";
import { Subscription } from "rxjs";
import { RegionBase } from '../region.base'

@Component({
  selector: 'region-menu',
  templateUrl: './regionMenu.template.html',
  styleUrls: ['./regionMenu.style.css'],
})
export class RegionMenuComponent extends RegionBase implements OnDestroy {

  private subscriptions: Subscription[] = []

  constructor(
    store$: Store<any>,
  ) {
    super(store$)
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe())
  }

}
