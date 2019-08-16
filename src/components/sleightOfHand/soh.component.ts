import { Component, Input, HostBinding, ChangeDetectionStrategy, HostListener } from "@angular/core";

@Component({
  selector: 'sleight-of-hand',
  templateUrl: './soh.template.html',
  styleUrls: [
    './soh.style.css'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class SleightOfHand{

  @HostBinding('class.do-not-close')
  get doNotCloseClass(){
    return this.doNotClose || this.focusInStatus
  }

  @HostListener('focusin')
  focusInHandler(){
    this.focusInStatus = true
  }

  @HostListener('focusout')
  focusOutHandler(){
    this.focusInStatus = false
  }

  private focusInStatus: boolean = false

  @Input()
  doNotClose: boolean = false
}