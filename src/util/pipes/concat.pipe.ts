import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'concat',
  pure: true
})

export class ConcatPipe implements PipeTransform {
  public transform(strings: string[], prefix: string='- ', suffix: string='', join: string='\n') {
    return strings.map(s => `${prefix}${s}${suffix}`).join(join)
  }
}