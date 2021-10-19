import { Component, Inject, Input } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";

@Component({
  selector: 'confirm-dialog-component',
  templateUrl: './confirmDialog.template.html',
  styleUrls: [
    './confirmDialog.style.css',
  ],
})
export class ConfirmDialogComponent {

  @Input()
  public title: string = 'Confirm'

  @Input()
  public message: string = 'Would you like to proceed?'

  @Input()
  public okBtnText: string = `OK`

  @Input()
  public cancelBtnText: string = `Cancel`

  @Input()
  public markdown: string

  public hideActionBar = false

  constructor(@Inject(MAT_DIALOG_DATA) data: any) {
    const { title = null, message  = null, markdown, okBtnText, cancelBtnText, hideActionBar} = data || {}
    if (title) this.title = title
    if (message) this.message = message
    if (markdown) this.markdown = markdown
    if (okBtnText) this.okBtnText = okBtnText
    if (cancelBtnText) this.cancelBtnText = cancelBtnText
    if (hideActionBar) this.hideActionBar = hideActionBar
  }
}
