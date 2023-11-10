import { Component, Input } from "@angular/core";
import { MatSnackBar } from 'src/sharedModules/angularMaterial.exports'
import { ARIA_LABELS } from 'common/constants'
import { Clipboard } from "@angular/cdk/clipboard";

@Component({
  selector: 'textarea-copy-export',
  templateUrl: './textareaCopyExport.template.html',
  styleUrls: [
    './textareaCopyExport.style.css'
  ]
})

export class TextareaCopyExportCmp {

  @Input('textarea-copy-export-label')
  label: string

  @Input('textarea-copy-export-text')
  input: string

  @Input('textarea-copy-export-rows')
  rows: number = 20

  @Input('textarea-copy-export-cols')
  cols: number = 50


  @Input('textarea-copy-export-download-filename')
  filename: string = 'download.txt'

  @Input('textarea-copy-export-disable')
  disableFlag: boolean = false

  public ARIA_LABELS = ARIA_LABELS

  constructor(
    private snackbar: MatSnackBar,
    private clipboard: Clipboard,
  ){

  }

  copyToClipboard(value: string){
    const success = this.clipboard.copy(`${value}`)
    this.snackbar.open(
      success ? `Copied to clipboard!` : `Failed to copy URL to clipboard!`,
      null,
      { duration: 1000 }
    )
  }
}
