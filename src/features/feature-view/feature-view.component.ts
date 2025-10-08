import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SAPI } from 'src/atlasComponents/sapi/sapi.service';
import { Feature } from 'src/atlasComponents/sapi/sxplrTypes';
import { DARKTHEME } from 'src/util/injectionTokens';
import { Store } from '@ngrx/store';
import { atlasSelection, userInteraction } from 'src/state';
import { CFIndex } from '../compoundFeatureIndices';
import { FeatureViewBase } from '../view/view-base.directive';
import { ExperimentalService } from 'src/experimental/experimental.service';

// const passRegionIdFeatureIds = [
//   "1a19693d-d99f-4789-b1ae-8ab5f0bb6432",
// ]

@Component({
  selector: 'sxplr-feature-view',
  templateUrl: './feature-view.component.html',
  styleUrls: ['./feature-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureViewComponent extends FeatureViewBase{

  constructor(
    sapi: SAPI,
    private store: Store,
    @Inject(DARKTHEME) darktheme$: Observable<boolean>,
    expmtSvc: ExperimentalService,
  ) {
    super(sapi, darktheme$, expmtSvc)
  }

  navigateToRegionByName(regionName: string){
    this.store.dispatch(
      atlasSelection.actions.navigateToRegion({
        region: {
          name: regionName
        }
      })
    )
  }

  clearSelectedFeature(): void{
    this.store.dispatch(
      userInteraction.actions.clearShownFeature()
    )
  }

  focusOnViewer(){
    this.store.dispatch(
      atlasSelection.actions.setViewerMode({
        viewerMode: "focusview:voi"
      })
    )
  }
}
