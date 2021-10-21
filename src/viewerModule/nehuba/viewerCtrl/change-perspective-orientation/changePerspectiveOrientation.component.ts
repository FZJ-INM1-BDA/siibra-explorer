import { Component, OnInit } from '@angular/core';
import {viewerStateChangeNavigation} from "src/services/state/viewerState/actions";
import {Store} from "@ngrx/store";

@Component({
  selector: 'app-change-perspective-orientation',
  templateUrl: './changePerspectiveOrientation.component.html',
  styleUrls: ['./changePerspectiveOrientation.component.sass']
})
export class ChangePerspectiveOrientationComponent implements OnInit {

  private viewOrientations = {
    coronal: [[0,-1,1,0], [-1,0,0,1]],
    sagittal: [[-1,-1,1,1], [-1,1,-1,1]],
    axial: [[0,0,1,0], [0,0,1,0]]
  }

  constructor(private store$: Store<any>,) { }

  ngOnInit(): void {
  }

  public set3DViewPoint(plane: 'coronal' | 'sagittal' | 'axial', view: 'first' | 'second') {

    const orientation = this.viewOrientations[plane][view === 'first'? 0 : 1]

    this.store$.dispatch(
      viewerStateChangeNavigation({
        navigation: {
          perspectiveOrientation: orientation,
        }
      })
    )
  }

}
