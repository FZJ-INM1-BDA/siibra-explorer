import { Component, Optional } from "@angular/core";
import QUICK_STARTER from '!!raw-loader!common/helpOnePager.md'
import { PureContantService } from "src/util";

@Component({
  selector: 'help-one-pager',
  templateUrl: './helpOnePager.template.html',
  styleUrls: [
    './helpOnePager.style.css'
  ]
})

export class HelpOnePager{
  public QUICK_STARTER_MD = QUICK_STARTER
  public extQuickStarter: string
  constructor(
    @Optional() pConstService: PureContantService
  ){
    if (pConstService?.backendUrl) {
      this.extQuickStarter = `${pConstService.backendUrl}quickstart`
    }
  }
}
