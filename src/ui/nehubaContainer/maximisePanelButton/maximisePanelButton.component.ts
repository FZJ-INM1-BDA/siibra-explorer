import { Component, Input } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { Observable } from "rxjs";
import { distinctUntilChanged, map } from "rxjs/operators";
import { PANELS } from 'src/services/state/ngViewerState.store.helper'
import { ARIA_LABELS } from 'common/constants'

const {
  MAXIMISE_VIEW,
  UNMAXIMISE_VIEW,
} = ARIA_LABELS

@Component({
  selector: 'maximise-panel-button',
  templateUrl: './maximisePanelButton.template.html',
  styleUrls: [
    './maximisePanelButton.style.css',
  ],
})

export class MaximmisePanelButton {

  public ARIA_LABEL_MAXIMISE_VIEW = MAXIMISE_VIEW
  public ARIA_LABEL_UNMAXIMISE_VIEW = UNMAXIMISE_VIEW

  @Input() public panelIndex: number

  private panelMode$: Observable<string>
  private panelOrder$: Observable<string>

  public isMaximised$: Observable<boolean>

  constructor(
    private store$: Store<any>,
  ) {
    this.panelMode$ = this.store$.pipe(
      select('ngViewerState'),
      select('panelMode'),
      distinctUntilChanged(),
    )

    this.panelOrder$ = this.store$.pipe(
      select('ngViewerState'),
      select('panelOrder'),
      distinctUntilChanged(),
    )

    this.isMaximised$ = this.panelMode$.pipe(
      map(panelMode => panelMode === PANELS.SINGLE_PANEL),
    )
  }
}
