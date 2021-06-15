import { MatSnackBar } from "@angular/material/snack-bar"
import { Clipboard } from "@angular/cdk/clipboard";
import { ARIA_LABELS } from 'common/constants'

export abstract class ToolCmpBase {
  public ARIA_LABELS = ARIA_LABELS
  constructor(
    protected clipboard: Clipboard,
    protected snackbar: MatSnackBar,  
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

  /**
   * Intention of navigating to ROI
   */
  abstract gotoRoi(): void
}
