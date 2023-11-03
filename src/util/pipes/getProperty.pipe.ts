import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'getProperty',
  pure: true
})

export class GetPropertyPipe<R extends Record<string|number, unknown>> implements PipeTransform{
  public transform(input: R, property: keyof R) {
    return input && input[property]
  }
}
