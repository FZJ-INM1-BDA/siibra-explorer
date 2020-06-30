import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'mapToProperty',
  pure: true
})

export class MapToPropertyPipe implements PipeTransform{
  public transform(input, property = '@id') {
    return input && input[property]
  }
}
