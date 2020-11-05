import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'filterByProperty',
  pure: true
})

export class FilterByPropertyPipe implements PipeTransform{
  public transform<T>(input: T[], prop: string): T[]{
    return input.filter(item => !!item[prop])
  }
}
