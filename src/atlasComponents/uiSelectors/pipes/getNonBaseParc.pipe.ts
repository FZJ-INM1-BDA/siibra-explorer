import { Pipe, PipeTransform } from "@angular/core";
import { SapiParcellationModel } from "src/atlasComponents/sapi";

@Pipe({
  name: 'getNonbaseParc',
  pure: true
})
export class GetNonbaseParcPipe implements PipeTransform{

  public transform(arr: SapiParcellationModel[]){
    if (!arr) return []
    return arr.filter(p => p.name.toLowerCase().indexOf("julich") < 0)
  }
}
