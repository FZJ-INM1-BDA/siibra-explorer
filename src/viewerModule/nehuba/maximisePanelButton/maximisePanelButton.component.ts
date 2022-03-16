import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { distinctUntilChanged, map } from "rxjs/operators";
import { ARIA_LABELS } from 'common/constants'
import { userInterface } from "src/state"

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
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class MaximisePanelButton {

  public ARIA_LABEL_MAXIMISE_VIEW = MAXIMISE_VIEW
  public ARIA_LABEL_UNMAXIMISE_VIEW = UNMAXIMISE_VIEW

  @Input() public panelIndex: number

  private panelMode$ = this.store$.pipe(
    select(userInterface.selectors.panelMode),
    distinctUntilChanged(),
  )

  public isMaximised$ = this.panelMode$.pipe(
    map(panelMode => panelMode === "SINGLE_PANEL"),
  )

  constructor(
    private store$: Store<any>,
  ) {

  }
}
