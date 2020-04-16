import { Directive, Input, HostListener } from "@angular/core";
import { KgSingleDatasetService } from "../singleDataset.base";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ViewerPreviewFile, IDataEntry } from 'src/services/state/dataStore.store'

@Directive({
  selector: '[iav-dataset-preview-dataset-file]',
  exportAs: 'iavDatasetPreviewDatasetFile'
})

export class PreviewDatasetFile{
  @Input('iav-dataset-preview-dataset-file')
  file: ViewerPreviewFile

  @Input('iav-dataset-preview-dataset-file-filename')
  filename: string
  
  @Input('iav-dataset-preview-dataset-file-dataset')
  dataset: IDataEntry

  @Input('iav-dataset-preview-dataset-file-kgid')
  kgId: string

  @Input('iav-dataset-preview-dataset-file-kgschema')
  kgSchema: string = `minds/core/dataset/v1.0.0`

  @Input('iav-dataset-preview-dataset-file-fullid')
  fullId: string

  constructor(
    private kgSingleDSService: KgSingleDatasetService,
    private snackbar: MatSnackBar,
  ){
  }

  private getFile(): Partial<ViewerPreviewFile>{
    if (!this.file && !this.filename) {
      return null
    }
    return this.file  || {
      filename: this.filename
    }
  }

  private getDataset(): Partial<IDataEntry>{
    return this.dataset || {
      fullId: this.fullId || `${this.kgSchema}/${this.kgId}`
    }
  }

  @HostListener('click')
  onClick(){
    const file = this.getFile()
    const dataset = this.getDataset()
    if (!file) {
      this.snackbar.open(`Cannot preview dataset file. Neither file nor filename are defined.`)
      return
    }
    this.kgSingleDSService.previewFile(file, dataset)
  }
}
