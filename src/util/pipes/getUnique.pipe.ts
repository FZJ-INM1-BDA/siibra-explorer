import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'getUniquePipe',
  pure: true
})

export class GetUniquePipe implements PipeTransform {
  public transform(arr: any[]) {
    return Array.from(new Set(arr))
  }
}
