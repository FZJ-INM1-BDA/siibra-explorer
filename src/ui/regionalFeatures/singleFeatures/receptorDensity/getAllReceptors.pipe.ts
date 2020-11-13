import { Pipe, PipeTransform } from "@angular/core";
import { IHasId } from "src/util/interfaces";

@Pipe({
  name: 'getAllReceptors',
  pure: true
})

export class GetAllReceptorsPipe implements PipeTransform{
  public transform(arr: IHasId[]): string[]{
    return (arr || []).reduce((acc, curr) => {
      const thisType = /_(pr|ar)_([a-zA-Z0-9_]+)\./.exec(curr['@id'])
      if (!thisType) return acc
      return new Set(acc).has(thisType) ? acc : acc.concat(thisType[2])
    }, [])
  }
}