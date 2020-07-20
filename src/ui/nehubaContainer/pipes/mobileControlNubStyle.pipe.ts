import { Pipe, PipeTransform } from "@angular/core";
import { PANELS } from 'src/services/state/ngViewerState.store.helper'


@Pipe({
  name: 'mobileControlNubStylePipe',
})

export class MobileControlNubStylePipe implements PipeTransform {
  public transform(panelMode: string): any {
    switch (panelMode) {
    case PANELS.SINGLE_PANEL:
      return {
        top: '80%',
        left: '95%',
      }
    case PANELS.V_ONE_THREE:
    case PANELS.H_ONE_THREE:
      return {
        top: '66.66%',
        left: '66.66%',
      }
    case PANELS.FOUR_PANEL:
    default:
      return {
        top: '50%',
        left: '50%',
      }
    }
  }
}
