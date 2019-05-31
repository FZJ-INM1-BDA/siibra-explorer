import { Pipe, PipeTransform } from "@angular/core";


@Pipe({
  name: 'aggregateArrayIntoRootPipe'
})

export class AggregateArrayIntoRootPipe implements PipeTransform{
  public transform(array: any[], rootName: string = 'Root Element', childrenPropertyName: string = 'children'){
    const returnObj = {
      name: rootName
    }
    returnObj[childrenPropertyName] = array
    return returnObj
  }
}