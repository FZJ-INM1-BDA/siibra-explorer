import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA } from "src/sharedModules/angularMaterial.exports";

export type FallBackData = {
  title: string
  titleMd?: string
  actions?: string[]
  desc?: string
  descMd?: string
  actionsAsList?: boolean
}

@Component({
  selector: 'sxplr-dialog-fallback-tmpl',
  templateUrl: './tmpl.template.html',
  styleUrls: [
    './tmpl.style.css'
  ],
})

export class DialogFallbackCmp {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: FallBackData
  ){

  }
}
