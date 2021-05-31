import { Component, Optional } from "@angular/core";
import QUICK_STARTER from '!!raw-loader!common/helpOnePager.md'
import { PureContantService } from "src/util";
import { ARIA_LABELS } from 'common/constants'

@Component({
  selector: 'help-one-pager',
  templateUrl: './helpOnePager.template.html',
  styleUrls: [
    './helpOnePager.style.css'
  ]
})

export class HelpOnePager{
  public ARIA_LABELS = ARIA_LABELS
  public QUICK_STARTER_MD = QUICK_STARTER
  public extQuickStarter: string
  public userDoc: string
  constructor(
    @Optional() pConstService: PureContantService
  ){
    this.extQuickStarter = `quickstart.html`
    if (pConstService) {
      this.userDoc = pConstService.docUrl
    }
  }
}
