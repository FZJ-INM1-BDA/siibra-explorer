import { MatDialog } from '@angular/material/dialog';
import { Component, Optional } from "@angular/core";
import { PureContantService } from "src/util";
import { ARIA_LABELS } from 'common/constants'
import { HowToCite } from '../howToCite/howToCite.component';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { default: QUICK_STARTER } = require('!!raw-loader!common/helpOnePager.md')

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
    @Optional() pConstService: PureContantService,
    private dialog: MatDialog,
  ){
    this.extQuickStarter = `quickstart.html`
    if (pConstService) {
      this.userDoc = pConstService.docUrl
    }
  }

  howToCite(){
    this.dialog.open(HowToCite)
  }
}
