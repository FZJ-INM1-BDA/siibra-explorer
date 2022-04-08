import { Pipe, PipeTransform } from "@angular/core";

type TReturn = {
  [key: string]: any[]
}

@Pipe({
  name: 'getGroupedParc',
  pure: true
})
export class GetGroupedParcPipe implements PipeTransform{

  public transform(arr: any[]):TReturn{
    const returnObj: TReturn = {}
    const filteredArr = arr.filter(p => p['groupName'])
    for (const obj of filteredArr) {
      const groupName: string = obj['groupName']
      returnObj[groupName] = (returnObj[groupName] || []).concat(obj)
    }
    return returnObj
  }
}
