import { Directive, HostListener, Input, TemplateRef } from "@angular/core";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";

type DialogSize = 's' | 'm' | 'l' | 'xl'

const sizeDict: Record<DialogSize, Partial<MatDialogConfig>> = {
  's': {
    width: '25vw',
    height: '25vh'
  },
  'm': {
    width: '50vw',
    height: '50vh'
  },
  'l': {
    width: '75vw',
    height: '75vh'
  },
  'xl': {
    width: '90vw',
    height: '90vh'
  }
}

@Directive({
  selector: `[sxplr-dialog]`,
  exportAs: 'sxplrDialog',
})

export class DialogDirective{

  @Input('sxplr-dialog')
  templateRef: TemplateRef<unknown>

  @Input('sxplr-dialog-size')
  size: DialogSize = 'm'

  @Input('sxplr-dialog-data')
  data: unknown

  constructor(
    private matDialog: MatDialog,
    private snackbar: MatSnackBar,
  ){
  }

  @HostListener('click')
  onClick(){
    if (!this.templateRef) {
      return this.snackbar.open(`Cannot show dialog. sxplr-dialog template not provided`)
    }
    this.matDialog.open(this.templateRef, {
      data: this.data,
      ...sizeDict[this.size]
    })
  }
}