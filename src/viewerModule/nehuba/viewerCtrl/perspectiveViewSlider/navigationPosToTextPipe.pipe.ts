import { Pipe, PipeTransform } from "@angular/core";

@Pipe({name: 'perspectiveViewRangeValue'})
export class NavigationPosToTextPipe implements PipeTransform {
  transform(navPosReal: number[], selectedPanel: number): string {
    return (navPosReal[selectedPanel === 0? 1 : selectedPanel === 1? 0 : 2] / 1e6).toFixed(3)
  }
}