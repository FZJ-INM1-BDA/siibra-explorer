import { Component } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { ARIA_LABELS } from 'common/constants'
import { SaneUrl } from "../saneUrl/saneUrl.component"

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

  openShareSaneUrl(){
    this.dialog.open(SaneUrl, { ariaLabel: ARIA_LABELS.SHARE_CUSTOM_URL })
  }
}