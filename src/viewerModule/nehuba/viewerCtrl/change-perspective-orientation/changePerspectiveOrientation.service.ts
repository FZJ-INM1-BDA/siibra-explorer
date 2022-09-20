import {Injectable} from "@angular/core";
import {Store} from "@ngrx/store";
import { actions } from 'src/state/atlasSelection';

@Injectable({
  providedIn: 'root'
})
export class ChangePerspectiveOrientationService {
    private viewOrientations = {
      coronal: [[0,-1,1,0], [-1,0,0,1]],
      sagittal: [[-1,-1,1,1], [-1,1,-1,1]],
      axial: [[0,0,1,0], [1,0,0,0]]
    }

    constructor(private store$: Store<any>,) { }

    public set3DViewPoint(plane: 'coronal' | 'sagittal' | 'axial', view: 'first' | 'second', zoom: any = '') {

      const orientation = this.viewOrientations[plane][view === 'first'? 0 : 1]

      this.store$.dispatch(
        actions.navigateTo({
          navigation: {
            perspectiveOrientation: orientation,
            perspectiveZoom: zoom
          },
          animation: true
        })
      )
    }
}
