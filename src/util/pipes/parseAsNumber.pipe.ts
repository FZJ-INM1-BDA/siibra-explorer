import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'parseAsNumber'
})

export class ParseAsNumberPipe implements PipeTransform{
  public transform(input: string | string[]): number | number[]{
    if (input instanceof Array) return input.map(v => Number(v))
    return Number(input)
  }
}
