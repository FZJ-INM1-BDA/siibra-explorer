import { ChangeDetectionStrategy, Component } from '@angular/core'
import { environment } from 'src/environments/environment'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { default: info } = require('!!raw-loader!../data/info.md')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { default: readmore } = require('!!raw-loader!../data/readmore.md')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { default: matomoInfo } = require('!!raw-loader!../data/aboutMatomo.md')

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
