import { Pipe, PipeTransform } from "@angular/core";
import { ViewerPreviewFile } from "src/services/state/dataStore.store";
import { getIdFromFullId } from "common/util"

@Pipe({
  name: 'previewFileVisibleInSelectedReferenceTemplatePipe'
})

export class PreviewFileVisibleInSelectedReferenceTemplatePipe implements PipeTransform{
  public transform(selectedReferenceSpace: any, file: ViewerPreviewFile): boolean{
    const { referenceSpaces = [] } = file
    if (referenceSpaces.some(({ name, fullId }) => name === '*' && fullId === '*')) return true
    const { fullId } = selectedReferenceSpace
    if (!fullId) return false
    return referenceSpaces.some(({ fullId: rsFullId }) => {
      const compare = getIdFromFullId(rsFullId) === getIdFromFullId(fullId)
      return compare
    })
  }
}