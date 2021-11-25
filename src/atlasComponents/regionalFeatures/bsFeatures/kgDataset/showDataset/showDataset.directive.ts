import { Directive, HostListener, Inject, Input, Optional } from "@angular/core";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { OVERWRITE_SHOW_DATASET_DIALOG_TOKEN, TOverwriteShowDatasetDialog } from "src/util/interfaces";
import { TRegionDetail as TSiibraRegion } from "src/util/siibraApiConstants/types";
import { TRegion as TContextRegion } from 'src/atlasComponents/regionalFeatures/bsFeatures/type'

export const IAV_DATASET_SHOW_DATASET_DIALOG_CMP = 'IAV_DATASET_SHOW_DATASET_DIALOG_CMP'
export const IAV_DATASET_SHOW_DATASET_DIALOG_CONFIG = `IAV_DATASET_SHOW_DATASET_DIALOG_CONFIG`

@Directive({
  selector: '[iav-dataset-show-dataset-dialog]',
  exportAs: 'iavDatasetShowDatasetDialog'
})
export class ShowDatasetDialogDirective{

  static defaultDialogConfig: MatDialogConfig = {
    autoFocus: false
  }

  @Input('iav-dataset-show-dataset-dialog-name')
  name: string

  @Input('iav-dataset-show-dataset-dialog-description')
  description: string

  @Input('iav-dataset-show-dataset-dialog-kgschema')
  kgSchema: string = 'minds/core/dataset/v1.0.0'

  @Input('iav-dataset-show-dataset-dialog-kgid')
  kgId: string

  @Input('iav-dataset-show-dataset-dialog-fullid')
  fullId: string

  @Input('iav-dataset-show-dataset-dialog-urls')
  urls: {
    cite: string
    doi: string
  }[] = []

  @Input('iav-dataset-show-dataset-dialog-ignore-overwrite')
  ignoreOverwrite = false

  @Input('iav-dataset-show-dataset-dialog-contexted-region')
  region: TSiibraRegion & TContextRegion

  constructor(
    private matDialog: MatDialog,
    private snackbar: MatSnackBar,
    @Optional() @Inject(IAV_DATASET_SHOW_DATASET_DIALOG_CMP) private dialogCmp: any,
    @Optional() @Inject(OVERWRITE_SHOW_DATASET_DIALOG_TOKEN) private overwriteFn: TOverwriteShowDatasetDialog
  ){ }

  @HostListener('click')
  onClick(){
    const data = (() => {
      if (this.fullId || (this.kgSchema && this.kgId)) {
        return {
          fullId: this.fullId || `${this.kgSchema}/${this.kgId}`
        }
      }
      if (this.name || this.description) {
        const { name, description, urls } = this
        return { name, description, urls, useClassicUi: true }
      }
    })()

    if (!data) {
      return this.snackbar.open(`Cannot show dataset. Neither fullId nor kgId provided.`)
    }

    if (!this.ignoreOverwrite && this.overwriteFn) {
      return this.overwriteFn(data)
    }

    if (!this.dialogCmp) throw new Error(`IAV_DATASET_SHOW_DATASET_DIALOG_CMP not provided!`)
    const { useClassicUi } = data
    this.matDialog.open(this.dialogCmp, {
      ...ShowDatasetDialogDirective.defaultDialogConfig,
      data,
      ...(useClassicUi ? {} : { panelClass: ['no-padding-dialog'] })
    })
  }
}
