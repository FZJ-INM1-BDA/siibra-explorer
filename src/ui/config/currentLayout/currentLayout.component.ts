import { Component } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { Observable } from "rxjs";
import { startWith } from "rxjs/operators";
import { SUPPORTED_PANEL_MODES } from "src/services/state/ngViewerState.store";
import { ngViewerSelectorPanelMode } from "src/services/state/ngViewerState/selectors";
import { IavRootStoreInterface } from "src/services/stateStore.service";

@Component({
  selector: 'current-layout',
  templateUrl: './currentLayout.template.html',
  styleUrls: [
    './currentLayout.style.css',
  ],
})

export class CurrentLayout {

  public supportedPanelModes = SUPPORTED_PANEL_MODES
  public panelMode$: Observable<string>

  constructor(
    private store$: Store<IavRootStoreInterface>,
  ) {
    this.panelMode$ = this.store$.pipe(
      select(ngViewerSelectorPanelMode),
      startWith(SUPPORTED_PANEL_MODES[0]),
    )
  }
}
