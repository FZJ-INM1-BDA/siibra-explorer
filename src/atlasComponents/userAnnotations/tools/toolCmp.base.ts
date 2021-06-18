import { MatSnackBar } from "@angular/material/snack-bar"
import { Clipboard } from "@angular/cdk/clipboard";
import { ARIA_LABELS } from 'common/constants'
import { ComponentStore } from "src/viewerModule/componentStore";
import { TExportFormats } from "./type";
import { Subscription } from "rxjs";

export abstract class ToolCmpBase {
  public ARIA_LABELS = ARIA_LABELS

  public viableFormats: TExportFormats[] = ['json', 'sands']
  public useFormat: TExportFormats = 'json'

  protected sub: Subscription[] = []
  constructor(
    protected clipboard: Clipboard,
    protected snackbar: MatSnackBar,
    protected cStore: ComponentStore<{ useFormat: TExportFormats }>,
  ){

    if (this.cStore) {
      this.sub.push(
        this.cStore.select(store => store.useFormat).subscribe((val: TExportFormats) => {
          this.useFormat = val
        })
      )
    }
  }

  setFormat(format: TExportFormats){
    if (this.cStore) {
      this.cStore.setState({
        useFormat: format
      })
    }
  }

  copyToClipboard(value: string){
    const success = this.clipboard.copy(`${value}`)
    this.snackbar.open(
      success ? `Copied to clipboard!` : `Failed to copy URL to clipboard!`,
      null,
      { duration: 1000 }
    )
  }

  /**
   * Intention of navigating to ROI
   */
  abstract gotoRoi(): void

  /**
   * Intention to remove
   */
  abstract remove(): void
}
