import { Pipe, PipeTransform } from "@angular/core";
import { IHasId } from "src/util/interfaces";

@Pipe({
  name: 'filterReceptorByType',
  pure: true
})

export class FilterReceptorByType implements PipeTransform{
  public transform(arr: IHasId[], qualifer: string): IHasId[]{
    return (arr || []).filter(({ ['@id']: dId }) => dId.indexOf(qualifer) >= 0)
  }
}
