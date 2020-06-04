import { Pipe, PipeTransform } from "@angular/core";
import { WidgetUnit } from "src/widget";

@Pipe({
  name: 'kgSearchBtnColorPipe',
})

export class KgSearchBtnColorPipe implements PipeTransform {
  public transform([minimisedWidgetUnit]: [Set<WidgetUnit>, string], wu: WidgetUnit ) {
    return minimisedWidgetUnit.has(wu)
      ? 'primary'
      : 'accent'
  }
}
