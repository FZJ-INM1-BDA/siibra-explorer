import { Component, ChangeDetectionStrategy } from '@angular/core'

@Component({
  selector: 'cookie-agreement',
  templateUrl: './cookieAgreement.template.html',
  styleUrls: [
    './cookieAgreement.style.css'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CookieAgreement {
  public showMore:boolean = false
}