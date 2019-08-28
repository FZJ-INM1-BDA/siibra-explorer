import { Component, Inject, Input } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";

@Component({
  selector: 'confirm-dialog-component',
  templateUrl: './confirmDialog.template.html',
  styleUrls: [
    './confirmDialog.style.css'
  ]
})
export class ConfirmDialogComponent{

  @Input()
  public title: string = 'Confirm'

  @Input()
  public message: string = 'Would you like to proceed?'

  constructor(@Inject(MAT_DIALOG_DATA) data: any){
    const { title = null, message  = null} = data || {}
    if (title) this.title = title
    if (message) this.message = message
  }
}