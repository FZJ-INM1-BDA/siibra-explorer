import { Component, TemplateRef } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { ARIA_LABELS } from 'common/constants'

@Component({
  selector: 'sxplr-share-sheet',
  templateUrl: './shareSheet.template.html',
  styleUrls: [
    `./shareSheet.style.css`
  ]
})

export class ShareSheetComponent{
  public ARIA_LABELS = ARIA_LABELS

  constructor(private dialog: MatDialog){

  }

  openDialog(templateRef: TemplateRef<unknown>){
    this.dialog.open(templateRef, { ariaLabel: ARIA_LABELS.SHARE_CUSTOM_URL })
  }
}
