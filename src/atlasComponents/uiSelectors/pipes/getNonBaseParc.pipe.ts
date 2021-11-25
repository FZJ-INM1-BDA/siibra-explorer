import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'getNonbaseParc',
  pure: true
})
export class GetNonbaseParcPipe implements PipeTransform{

  public transform(arr: any[]){
    return arr.filter(p => !p['baseLayer'])
  }
}
