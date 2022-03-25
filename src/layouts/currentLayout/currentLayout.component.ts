import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { userInterface } from "src/state"

@Component({
  selector: 'current-layout',
  templateUrl: './currentLayout.template.html',
  styleUrls: [
    './currentLayout.style.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class CurrentLayout {

  @Input('current-layout-use-layout')
  public useLayout: userInterface.PanelMode = "FOUR_PANEL"
  
  public panelModes: Record<string, userInterface.PanelMode> = {
    FOUR_PANEL: "FOUR_PANEL",
    H_ONE_THREE: "H_ONE_THREE",
    SINGLE_PANEL: "SINGLE_PANEL",
    V_ONE_THREE: "V_ONE_THREE"
  }

  public panelMode: userInterface.PanelMode = null

  constructor() {}
}
