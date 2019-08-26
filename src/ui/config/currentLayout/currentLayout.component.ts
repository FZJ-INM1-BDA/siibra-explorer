import { Component } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { Observable } from "rxjs";
import { SUPPORTED_PANEL_MODES } from "src/services/state/ngViewerState.store";
import { startWith } from "rxjs/operators";

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

  constructor(private store$: Store<any>){
    this.panelMode$ = this.store$.pipe(
      select('ngViewerState'),
      select('panelMode'),
      startWith(SUPPORTED_PANEL_MODES[0])
    )
  }
}