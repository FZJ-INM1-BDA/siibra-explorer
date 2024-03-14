import { Component, EventEmitter, Input, Output } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Store } from "@ngrx/store";
import { BehaviorSubject } from "rxjs";
import { SAPI } from "src/atlasComponents/sapi";
import { SimpleCompoundFeature } from "src/atlasComponents/sapi/sxplrTypes";
import { userInteraction } from "src/state";

@Component({
  templateUrl: './compoundFtContainer.template.html',
  styleUrls: [
    './compoundFtContainer.style.css'
  ],
  selector: 'compound-feature-container',
})

export class CompoundFtContainer {
  @Input()
  compoundFeature: SimpleCompoundFeature

  @Output()
  dismiss = new EventEmitter()

  busy$ = new BehaviorSubject(false)

  constructor(private sapi: SAPI, private store: Store, private snackbar: MatSnackBar){
  }
  async showSubfeature(id: string){
    try {
      this.busy$.next(true)
      const feature = await this.sapi.getV3FeatureDetailWithId(id).toPromise()
      this.store.dispatch(
        userInteraction.actions.showFeature({ feature })
      )
      this.dismiss.emit()
    } catch (e) {
      console.log('error', e)
      this.snackbar.open(`Error: ${e.toString()}`, "Dismiss")
    } finally {
      this.busy$.next(false)
    }
  }
}

/**
 * TODO
 * 
 * check http://localhost:10081/v3_0/feature/lq0::BigBrainIntensityProfile::p:minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579-300::r:Area%20hOc1%20(V1,%2017,%20CalcS)%20left::4c05163cac01b560cddf9d0ae2b63c94
 * 
 * see https://github.com/FZJ-INM1-BDA/siibra-python/issues/509
 */