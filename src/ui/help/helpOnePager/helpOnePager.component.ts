import { MatDialog } from '@angular/material/dialog';
import { Component } from "@angular/core";
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
  public extQuickStarter: string = `quickstart`
  public userDoc: string
  constructor(
    private dialog: MatDialog,
  ){}

  howToCite(){
    this.dialog.open(HowToCite)
  }
}
