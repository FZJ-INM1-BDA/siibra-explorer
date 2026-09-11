import { Component, Inject } from "@angular/core";
import { FeatureViewBase } from "../view/view-base.directive";
import { SAPI } from "src/atlasComponents/sapi";
import { Store } from "@ngrx/store";
import { DARKTHEME } from "src/util/injectionTokens";
import { Observable } from "rxjs";
import { ExperimentalService } from "src/experimental/experimental.service";
import { atlasSelection } from "src/state";
import { DoiTemplate } from "src/ui/doi/doi.component";
import { enLabels } from "src/uiLabels";
import { SXPLR_PREFIX } from "src/util/constants";

@Component({
  selector: 'sxplr-feature-simple-single',
  templateUrl: './simpleSingle.template.html',
  styleUrls: [
    './simpleSingle.style.scss'
  ]
})

export class SimpleSingleFeatureCmp extends FeatureViewBase {

  DoiTemplate = DoiTemplate
  labels = enLabels
  SXPLR_PREFIX = SXPLR_PREFIX

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
}
