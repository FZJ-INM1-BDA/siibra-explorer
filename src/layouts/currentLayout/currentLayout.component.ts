import { Component } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { Observable } from "rxjs";
import { userInterface } from "src/state"

@Component({
  selector: 'current-layout',
  templateUrl: './currentLayout.template.html',
  styleUrls: [
    './currentLayout.style.css',
  ],
})

export class CurrentLayout {

  public FOUR_PANEL: userInterface.PanelMode = "FOUR_PANEL"
  
  public panelModes: Record<string, userInterface.PanelMode> = {
    FOUR_PANEL: "FOUR_PANEL",
    H_ONE_THREE: "H_ONE_THREE",
    SINGLE_PANEL: "SINGLE_PANEL",
    V_ONE_THREE: "V_ONE_THREE"
  }
  public panelMode$: Observable<userInterface.PanelMode> = this.store$.pipe(
    select(userInterface.selectors.panelMode)
  )

  constructor(
    private store$: Store<any>,
  ) {
  }
}
