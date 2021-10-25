import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'getIndividualParc',
  pure: true
})
export class GetIndividualParcPipe implements PipeTransform{

  public transform(arr: any[]){
    return arr.filter(p => !p['groupName'])
  }
}
