import { Pipe, PipeTransform } from "@angular/core";

type GroupByFn = (x: unknown) => string

@Pipe({
  name: 'groupby',
  pure: true
})

export class GroupByPipe implements PipeTransform{
  public transform<T>(arr: T[], groupbyFn: GroupByFn) {
    const returnVal: Record<string, T[]> = {}
    for (const item of arr){
      const key = groupbyFn(item)
      if (!returnVal[key]) {
        returnVal[key] = [item]
        continue
      }
      returnVal[key].push(item)
    }
    return returnVal
  }
}