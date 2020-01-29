import { Pipe, PipeTransform } from "@angular/core";

export const steps = [
  'byte(s)',
  'KB',
  'MB',
  'GB',
  'TB',
]

@Pipe({
  name: 'humanReadableFileSizePipe',
})

export class HumanReadableFileSizePipe implements PipeTransform {
  public transform(input: string | number, precision: number = 2) {
    let _input = Number(input)
    if (!_input) { throw new Error(`HumanReadableFileSizePipe needs a string or a number that can be parsed to number`) }
    const _precision = Number(precision)
    if (isNaN(_precision)) { throw new Error(`precision must be a number`) }
    let counter = 0
    while (_input > 1000 && counter < 4) {
      _input = _input / 1000
      counter += 1
    }
    return `${_input.toFixed(precision)} ${steps[counter]}`
  }
}
