import { Pipe, PipeTransform } from "@angular/core";
import { WidgetUnit } from "src/atlasViewer/widgetUnit/widgetUnit.component";

@Pipe({
  name: 'menuIconKgSearchBtnClsPipe'
})

export class MenuIconKgSearchBtnClsPipe implements PipeTransform{
  public transform([minimisedWidgetUnit, themedBtnCls]: [Set<WidgetUnit>, string], wu: WidgetUnit, ){
    return minimisedWidgetUnit.has(wu)
      ? themedBtnCls + ' border-primary'
      : 'btn-primary'
  }
}