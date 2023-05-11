import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'prettyPresent',
  pure: true
})
export class PrettyPresentPipe implements PipeTransform {

  transform(value: unknown, toFixed: number=4): unknown {
    if (value === null) {
      return null
    }
    if (typeof value === "string") {
      return value
    }
    if (Array.isArray(value)) {
      return value.map(v => this.transform(v)).join(", ")
    }
    if (typeof value === "number") {
      return value.toFixed(toFixed)
    }
    if (typeof value === "object") {
      if (value['name']) {
        return value['name']
      }
      return 'Unknown'
    }
    return null;
  }

}
