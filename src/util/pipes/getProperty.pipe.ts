import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'getProperty',
  pure: true
})

export class GetPropertyPipe implements PipeTransform{
  public transform(input, property = '@id') {
    return input && input[property]
  }
}
