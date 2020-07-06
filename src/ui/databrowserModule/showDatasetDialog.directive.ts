import { Directive, Input, HostListener, Inject } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";

export const IAV_DATASET_SHOW_DATASET_DIALOG_CMP = 'IAV_DATASET_SHOW_DATASET_DIALOG_CMP'
export const IAV_DATASET_SHOW_DATASET_DIALOG_CONFIG = `IAV_DATASET_SHOW_DATASET_DIALOG_CONFIG`

@Directive({
  selector: '[iav-dataset-show-dataset-dialog]',
  exportAs: 'iavDatasetShowDatasetDialog'
})

export class ShowDatasetDialogDirective{

  static defaultDialogConfig = {
    autoFocus: false
  }

  @Input('iav-dataset-show-dataset-dialog-kgschema')
  kgSchema: string = 'minds/core/dataset/v1.0.0'

  @Input('iav-dataset-show-dataset-dialog-kgid')
  kgId: string

  @Input('iav-dataset-show-dataset-dialog-fullid')
  fullId: string

  constructor(
    private matDialog: MatDialog,
    private snackbar: MatSnackBar,
    @Inject(IAV_DATASET_SHOW_DATASET_DIALOG_CMP) private dialogCmp: any
  ){ }

  @HostListener('click')
  onClick(){

    if (this.fullId || (this.kgSchema && this.kgId)) {

      this.matDialog.open(this.dialogCmp, {
        ...ShowDatasetDialogDirective.defaultDialogConfig,
        data: {
          fullId: this.fullId || `${this.kgSchema}/${this.kgId}`
        }
      })

    } else {
      this.snackbar.open(`Cannot show dataset. Neither fullId nor kgId provided.`)
    }
  }
}
