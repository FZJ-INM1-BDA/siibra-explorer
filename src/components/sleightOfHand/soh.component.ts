import { ChangeDetectionStrategy, Component, HostBinding, HostListener, Input } from "@angular/core";

@Component({
  selector: 'sleight-of-hand',
  templateUrl: './soh.template.html',
  styleUrls: [
    './soh.style.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class SleightOfHand {

  @HostBinding('class.do-not-close')
  get doNotCloseClass() {
    return this.doNotClose || this.focusInStatus
  }

  @HostListener('focusin')
  public focusInHandler() {
    this.focusInStatus = true
  }

  @HostListener('focusout')
  public focusOutHandler() {
    this.focusInStatus = false
  }

  private focusInStatus: boolean = false

  @Input()
  public doNotClose: boolean = false
}
