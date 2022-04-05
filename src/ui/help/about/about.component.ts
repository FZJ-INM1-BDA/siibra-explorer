import { Component } from '@angular/core'

@Component({
  selector: 'iav-about',
  templateUrl: './about.template.html',
  styleUrls: [
    './about.style.css',
  ],
})

export class AboutCmp {
  public supportEmailAddress: string = `support@ebrains.eu`
  public contactEmailHref: string = `mailto:${this.supportEmailAddress}?Subject=[siibra-explorer]%20Queries`

  public userDoc = `https://siibra-explorer.readthedocs.io/en/latest/`
  public repoUrl = `https://github.com/FZJ-INM1-BDA/siibra-explorer`
}
