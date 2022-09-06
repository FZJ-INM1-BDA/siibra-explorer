import { Pipe, PipeTransform } from "@angular/core";
import { EnumWidgetState } from "./constants"

@Pipe({
  name: 'widgetStateIcon',
  pure: true
})

export class WidgetStateIconPipe implements PipeTransform{
  public transform(state: EnumWidgetState): string {
    switch (state) {
    case EnumWidgetState.MINIMIZED: {
      return 'fas fa-window-minimize'
    }
    case EnumWidgetState.NORMAL: {
      return 'fas fa-window-restore'
    }
    case EnumWidgetState.MAXIMIZED: {
      return 'fas fa-window-maximize'
    }
    default: {
      return 'fas fa-window-restore'
    }
    }
  }
}
