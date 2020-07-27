import { Component, OnDestroy, Input } from "@angular/core";
import { Store } from "@ngrx/store";
import { Subscription } from "rxjs";
import { RegionBase } from '../region.base'
import { ARIA_LABELS } from 'common/constants'

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

  @Input()
  showRegionInOtherTmpl: boolean = true

  SHOW_IN_OTHER_REF_SPACE = ARIA_LABELS.SHOW_IN_OTHER_REF_SPACE
}
