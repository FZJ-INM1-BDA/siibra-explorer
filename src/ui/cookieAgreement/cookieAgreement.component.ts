import { Component, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core'

@Component({
  selector: 'cookie-agreement',
  templateUrl: './cookieAgreement.template.html',
  styleUrls: [
    './cookieAgreement.style.css'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CookieAgreement {
  showMore = false;

  @Output()
  clickedOk: EventEmitter<null> = new EventEmitter()

  agreeCookies() {
    this.clickedOk.emit(null)
  }
}