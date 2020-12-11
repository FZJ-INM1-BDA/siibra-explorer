import { Pipe, PipeTransform } from "@angular/core"

/**
 * TODO find this pipe a home
 * not too sure where this should stay
 */
@Pipe({
  name: 'regionAccordionTooltipTextPipe',
  pure: true
})

export class RegionAccordionTooltipTextPipe implements PipeTransform{

  public transform(length: number, type: string): string{
    switch (type) {
    case 'regionInOtherTmpl': return `Region available in ${length} other reference space${length > 1 ? 's' : ''}`
    case 'regionalFeatures': return `${length} regional feature${length > 1 ? 's' : ''} found`
    case 'connectivity': return `${length} connections found`
    default: return `${length} items found`
    }
  }
}
