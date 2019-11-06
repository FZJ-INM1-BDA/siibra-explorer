import { Component } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { Observable } from "rxjs";
import { SUPPORTED_PANEL_MODES } from "src/services/state/ngViewerState.store";
import { startWith } from "rxjs/operators";
import { IavRootStoreInterface } from "src/services/stateStore.service";

@Component({
  selector: 'current-layout',
  templateUrl: './currentLayout.template.html',
  styleUrls: [
    './currentLayout.style.css'
  ]
})

export class CurrentLayout{

  public supportedPanelModes = SUPPORTED_PANEL_MODES
  public panelMode$: Observable<string>

  constructor(
    private store$: Store<IavRootStoreInterface>,
  ){
    this.panelMode$ = this.store$.pipe(
      select('ngViewerState'),
      select('panelMode'),
      startWith(SUPPORTED_PANEL_MODES[0])
    )
  }
}