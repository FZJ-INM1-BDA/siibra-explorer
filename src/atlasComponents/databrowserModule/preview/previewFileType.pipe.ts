import { Pipe, PipeTransform } from "@angular/core";
import { ViewerPreviewFile } from "src/services/state/dataStore.store";
import { determinePreviewFileType } from "./previewFileIcon.pipe";

@Pipe({
  name: 'previewFileTypePipe',
})

export class PreviewFileTypePipe implements PipeTransform {
  public transform(file: ViewerPreviewFile): string {
    return determinePreviewFileType(file)
  }
}
