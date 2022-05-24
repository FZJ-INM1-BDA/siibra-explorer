import { Component } from '@angular/core';
import {Store} from "@ngrx/store";
import { actions } from 'src/state/atlasSelection';

@Component({
  selector: 'app-change-perspective-orientation',
  templateUrl: './changePerspectiveOrientation.component.html',
  styleUrls: ['./changePerspectiveOrientation.component.sass']
})
export class ChangePerspectiveOrientationComponent {

  private viewOrientations = {
    coronal: [[0,-1,1,0], [-1,0,0,1]],
    sagittal: [[-1,-1,1,1], [-1,1,-1,1]],
    axial: [[0,0,1,0], [1,0,0,0]]
  }

  constructor(private store$: Store<any>,) { }

  public set3DViewPoint(plane: 'coronal' | 'sagittal' | 'axial', view: 'first' | 'second') {

    const orientation = this.viewOrientations[plane][view === 'first'? 0 : 1]

    this.store$.dispatch(
      actions.navigateTo({
        navigation: {
          perspectiveOrientation: orientation,
        },
        animation: true
      })
    )
  }

}
