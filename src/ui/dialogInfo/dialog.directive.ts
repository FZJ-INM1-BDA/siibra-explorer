import { Directive, HostListener, Inject, Input, Optional } from "@angular/core";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { OVERWRITE_SHOW_DATASET_DIALOG_TOKEN, TOverwriteShowDatasetDialog } from "src/util/interfaces";
import { IAV_DATASET_SHOW_DATASET_DIALOG_CMP } from "./const";

@Directive({
  selector: `[iav-dataset-show-dataset-dialog]`,
  exportAs: 'iavDatasetShowDatasetDialog',
})

export class DialogDirective{

  static defaultDialogConfig: MatDialogConfig = {
    autoFocus: false
  }

  @Input('iav-dataset-show-dataset-dialog-name')
  name: string

  @Input('iav-dataset-show-dataset-dialog-description')
  description: string

  @Input('iav-dataset-show-dataset-dialog-kgschema')
  set kgSchema(val) {
    throw new Error(`setting kgschema & kgid has been deprecated`)
  }

  @Input('iav-dataset-show-dataset-dialog-kgid')
  set kgId(val) {
    throw new Error(`setting kgschema & kgid has been deprecated`)
  }

  @Input('iav-dataset-show-dataset-dialog-fullid')
  set fullId(val) {
    throw new Error(`setting fullid has been deprecated`)
  }


  @Input('iav-dataset-show-dataset-dialog-urls')
  urls: {
    cite: string
    doi: string
  }[] = []

  @Input('iav-dataset-show-dataset-dialog-ignore-overwrite')
  ignoreOverwrite = false


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
      ...DialogDirective.defaultDialogConfig,
      data,
      ...(useClassicUi ? {} : { panelClass: ['no-padding-dialog'] })
    })
  }
}