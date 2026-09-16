import { Pipe, PipeTransform } from "@angular/core";

type TObj = Record<string, any>

@Pipe({
  name: 'mergeObj',
  pure: true
})

export class MergeObjPipe implements PipeTransform{
  public transform(o1: TObj|null, o2: TObj){
    return {
      ...(o1 || {}),
      ...o2
    }
  }
}
