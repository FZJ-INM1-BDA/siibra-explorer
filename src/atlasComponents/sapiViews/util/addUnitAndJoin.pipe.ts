import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'addUnitAndJoin',
  pure: true
})

export class AddUnitAndJoin implements PipeTransform{
  public transform(arr: (string | number)[], unit: string = '', separator: string = ', '): string {
    return arr.map(v => `${v}${unit}`).join(separator)
  }
}