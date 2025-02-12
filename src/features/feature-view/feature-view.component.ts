import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SAPI } from 'src/atlasComponents/sapi/sapi.service';
import { Feature } from 'src/atlasComponents/sapi/sxplrTypes';
import { DARKTHEME } from 'src/util/injectionTokens';
import { Store } from '@ngrx/store';
import { atlasSelection, userInteraction } from 'src/state';
import { CFIndex } from '../compoundFeatureIndices';
import { FeatureViewBase } from '../view/view-base.directive';

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
  ) {
    super(sapi, darktheme$)
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

  
  showSubfeature(_item: CFIndex|Feature){
    // Not used. Commented out for the addition of contributors in features
    // this.store.dispatch(
    //   userInteraction.actions.showFeature({
    //     feature: item
    //   })
    // )
  }
  
  clearSelectedFeature(): void{
    this.store.dispatch(
      userInteraction.actions.clearShownFeature()
    )
  }

}
