import { Component, Inject, Optional } from "@angular/core"
import { MAT_DIALOG_DATA } from "@angular/material/dialog"
import { CONST, ARIA_LABELS } from "common/constants"

@Component({
  templateUrl: './dialog.template.html',
  styleUrls: [
    './dialog.style.css'
  ]
})

export class DialogCmp{
  public useClassicUi = false
  public CONST = CONST
  public ARIA_LABELS = ARIA_LABELS
  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ){
    const { dataType, description, name, urls, useClassicUi, view, region, summary, isGdprProtected } = data
    this.useClassicUi = data.useClassicUi
  }
}