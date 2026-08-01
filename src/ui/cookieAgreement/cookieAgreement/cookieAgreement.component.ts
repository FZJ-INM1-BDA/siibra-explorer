import { ChangeDetectionStrategy, Component } from '@angular/core'
import { environment } from 'src/environments/environment'

import info from '../data/info.md'
import readmore from '../data/readmore.md'
import matomoInfo from '../data/aboutMatomo.md'

@Component({
  selector: 'cookie-agreement',
  templateUrl: './cookieAgreement.template.html',
  styleUrls: [
    './cookieAgreement.style.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  preserveWhitespaces: true
})
export class CookieAgreement {
  public showMore: boolean = false
  public showMamoto: boolean = false

  public matomoUrl: string = environment.MATOMO_URL

  public markdownInfo: string = info
  public markdownReadmore: string = readmore
  public matomoInfo: string = matomoInfo

  public optOutUrl: string

  constructor(){
    if (this.matomoUrl) {
      this.optOutUrl = `${this.matomoUrl}index.php?module=CoreAdminHome&action=optOut&language=en`
    }
  }
}
