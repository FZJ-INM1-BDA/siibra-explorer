import { ChangeDetectionStrategy, Component } from '@angular/core';
import { select, Store } from "@ngrx/store";
import { concat, Observable, of } from 'rxjs';
import { atlasSelection } from 'src/state';
import { actions } from 'src/state/atlasSelection';
import { VALUES } from "common/constants"
import { floatEquality } from "common/util"
import { filter, map } from 'rxjs/operators';
import { EnumClassicalView } from "src/atlasComponents/constants"

const viewOrientations : Record<EnumClassicalView, number[][]> = {
  [EnumClassicalView.CORONAL]: [[0,-1 * VALUES.ROOT_2,VALUES.ROOT_2,0], [-1 * VALUES.ROOT_2,0,0,VALUES.ROOT_2]],
  [EnumClassicalView.SAGITTAL]: [[-0.5,-0.5,0.5,0.5], [-0.5,0.5,-0.5,0.5]],
  [EnumClassicalView.AXIAL]: [[0,0,1,0], [1,0,0,0]]
}

@Component({
  selector: 'snap-perspective-orientation-cmp',
  templateUrl: './snapPerspectiveOrientation.template.html',
  styleUrls: ['./snapPerspectiveOrientation.style.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SnapPerspectiveOrientationCmp {

  public currentView: EnumClassicalView = null
  public EnumClassicalView = EnumClassicalView
  public currentPersView$: Observable<null|EnumClassicalView> = concat(
    of(null),
    this.store$.pipe(
      select(atlasSelection.selectors.navigation),
      filter(v => !!v),
      map(({ perspectiveOrientation }) => {
        if (
          perspectiveOrientation.some(v => floatEquality( Math.abs (v), 1, VALUES.THRESHOLD))
        ) {
          return EnumClassicalView.AXIAL
        }
  
        if (
          perspectiveOrientation.every(v => floatEquality( Math.abs(v), 0.5, VALUES.THRESHOLD))
        ) {
          return EnumClassicalView.SAGITTAL
        }
  
        if (
          perspectiveOrientation.filter(v => floatEquality( Math.abs(v), VALUES.ROOT_2, VALUES.THRESHOLD )).length === 2
        ) {
          return EnumClassicalView.CORONAL
        }
        return null
      }),
    )
  )

  constructor(private store$: Store) {}

  public set3DViewPoint(plane: EnumClassicalView) {

    this.counter ++
    const orientation = viewOrientations[plane][this.counter % 2]

    this.store$.dispatch(
      actions.navigateTo({
        navigation: {
          perspectiveOrientation: orientation,
        },
        animation: true
      })
    )
  }
  private counter = 0
}
