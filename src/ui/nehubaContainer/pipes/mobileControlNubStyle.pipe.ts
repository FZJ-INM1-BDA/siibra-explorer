import { Pipe, PipeTransform } from "@angular/core";
import { FOUR_PANEL, H_ONE_THREE, SINGLE_PANEL, V_ONE_THREE } from "src/services/state/ngViewerState.store";

@Pipe({
  name: 'mobileControlNubStylePipe',
})

export class MobileControlNubStylePipe implements PipeTransform {
  public transform(panelMode: string): any {
    switch (panelMode) {
      case SINGLE_PANEL:
        return {
          top: '80%',
          left: '95%',
        }
      case V_ONE_THREE:
      case H_ONE_THREE:
        return {
          top: '66.66%',
          left: '66.66%',
        }
      case FOUR_PANEL:
      default:
        return {
          top: '50%',
          left: '50%',
        }
    }
  }
}
