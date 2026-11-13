import { Pipe, PipeTransform } from "@angular/core";


@Pipe({
  standalone: true,
  pure: true,
  name: 'filterDeprecated'
})

export class FilterDeprecatedPipe implements PipeTransform {
  public transform(input: any[]) {
    return input.filter(i => !i.name.includes("[DEPRECATED]"))
  }
}
