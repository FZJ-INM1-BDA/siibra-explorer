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

  /**
   * Intention of navigating to ROI
   */
  abstract gotoRoi(): void

  /**
   * Intention to remove
   */
  abstract remove(): void
}
