import { Component } from "@angular/core";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { default: HOWTOCITE } = require('!!raw-loader!common/howToCite.md')

@Component({
  selector: 'how-to-cite',
  templateUrl: './howToCite.template.html',
  styleUrls: [
    './howToCite.style.css'
  ]
})

export class HowToCite{
  public HOWTOCITE = HOWTOCITE
}