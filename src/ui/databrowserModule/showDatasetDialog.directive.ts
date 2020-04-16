import { Directive, Input, HostListener } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { SingleDatasetView } from "./singleDataset/detailedView/singleDataset.component";

@Directive({
  selector: '[iav-dataset-show-dataset-dialog]',
  exportAs: 'iavDatasetShowDatasetDialog'
})

export class ShowDatasetDialogDirective{

  @Input()
  kgSchema: string = 'minds/core/dataset/v1.0.0'

  @Input('iav-dataset-show-dataset-dialog-kgid')
  kgId: string

  @Input('iav-dataset-show-dataset-dialog-fullid')
  fullId: string

  constructor(
    private matDialog: MatDialog,
    private snackbar: MatSnackBar,
  ){ }

  @HostListener('click')
  onClick(){

    if (this.fullId || (this.kgSchema && this.kgId)) {

      this.matDialog.open(SingleDatasetView, {
        autoFocus: false,
        data: {
          fullId: this.fullId || `${this.kgSchema}/${this.kgId}`
        }
      })

    } else {
      this.snackbar.open(`Cannot show dataset. Neither fullId nor kgId provided.`)
    }
  }
}
