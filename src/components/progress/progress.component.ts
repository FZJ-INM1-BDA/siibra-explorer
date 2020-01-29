import { ChangeDetectionStrategy, Component, Input } from "@angular/core";

@Component({
  selector: 'progress-bar',
  templateUrl: './progress.template.html',
  styleUrls: [
    './progress.style.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class ProgressBar {
  @Input() public progressStyle: any

  private _progress: number = 0
  /**
   * between 0 and 1
   */
  @Input()
  set progress(val: number) {
    if (isNaN(val)) {
      this._progress = 0
      return
    }
    if (val < 0 || val === null) {
      this._progress = 0
      return
    }
    if (val > 1) {
      this._progress = 1
      return
    }
    this._progress = val
  }

  get progress() {
    return this._progress
  }

  get progressPercent() {
    return `${this.progress * 100}%`
  }
}
