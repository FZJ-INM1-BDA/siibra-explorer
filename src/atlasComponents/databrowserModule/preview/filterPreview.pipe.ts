import { Pipe, PipeTransform } from "@angular/core";
import { EnumPreviewFileTypes } from "../pure";
import { ViewerPreviewFile } from "src/services/state/dataStore.store";
import { determinePreviewFileType } from "../constants";

@Pipe({
  name: 'filterPreviewByType'
})

export class FilterPreviewByType implements PipeTransform{
  public transform(files: ViewerPreviewFile[], types: EnumPreviewFileTypes[]){
    return files.filter(f => {
      const currentFileType = determinePreviewFileType(f)
      return types.includes(currentFileType) 
    })
  }
}