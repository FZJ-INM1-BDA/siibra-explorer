import { Component } from "@angular/core";

import HOWTOCITE from 'common/howToCite.md'

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