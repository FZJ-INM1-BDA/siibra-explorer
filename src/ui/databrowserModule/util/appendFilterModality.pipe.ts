import { Pipe, PipeTransform } from "@angular/core";
import { CountedDataModality } from "../databrowser.service";

@Pipe({
  name: 'appendFilterModalityPipe'
})

export class AppendFilerModalityPipe implements PipeTransform{
  public transform(root: CountedDataModality[], appending: CountedDataModality[][]): CountedDataModality[]{
    let returnArr:CountedDataModality[] = [...root]
    for (const mods of appending){
      for (const mod of mods){
        // preserve the visibility
        const { visible } = returnArr.find(({ name }) => name === mod.name) || mod
        returnArr = returnArr.filter(({ name }) => name !== mod.name)
        returnArr = returnArr.concat({
          ...mod,
          visible
        })
      }
    }
    return returnArr
  }
}