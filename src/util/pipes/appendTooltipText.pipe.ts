import { Pipe, PipeTransform } from "@angular/core";

/**
 * TODO
 * merge this pipe into cpProp pipe
 */

@Pipe({
  name: 'appendTooltipTextPipe',
})

export class AppendtooltipTextPipe implements PipeTransform {
  public transform(array: any[]) {
    return array.map(item => {
      const { properties = {} } = item
      const { description: tooltipText } = properties
      return {
        ...item,
        tooltipText,
      }
    })
  }
}
