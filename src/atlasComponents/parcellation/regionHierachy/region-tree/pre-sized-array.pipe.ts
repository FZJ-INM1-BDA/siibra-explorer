import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'preSizedArray'
})
export class PreSizedArrayPipe implements PipeTransform {
  transform(value: number, ...args: any[]): Array<any> {
    return new Array<number>(value);
  }
}
