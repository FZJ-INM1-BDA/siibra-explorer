import { Pipe, PipeTransform } from "@angular/core";

@Pipe({name: 'perspectiveViewRangeValue'})
export class PerspectiveViewRangeValue implements PipeTransform {
  transform(value: any, panel: number): string {
    return (value[panel === 0? 1 : panel === 1? 0 : 2] / 1e6).toFixed(3)
  }
}