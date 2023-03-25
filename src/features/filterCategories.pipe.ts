import { KeyValue } from "@angular/common"
import { Pipe, PipeTransform } from "@angular/core"
import { PathReturn } from "src/atlasComponents/sapi/typeV3"

type DS = KeyValue<string, PathReturn<"/feature/_types">["items"]>

@Pipe({
  name: 'filterCategory',
  pure: true
})
export class FilterCategoriesPipe implements PipeTransform{
  public transform(datasets: DS[], keys: string[], inclFlag: boolean=true) {
    return (datasets || []).filter(d => inclFlag === keys.includes(d.key) )
  }
}
