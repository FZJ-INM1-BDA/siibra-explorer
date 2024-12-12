import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'dedup',
  pure: true
})

export class DedupPipe implements PipeTransform {
  public transform<T>(values: T[], comparison: ((a: T, b: T) => boolean) = (a, b) => a === b) {
    return values.reduce((acc, curr) => {
      if (acc.find(v => comparison(v, curr))) {
        return acc
      }
      return acc.concat(curr)
    }, [] as T[])
  }
}
