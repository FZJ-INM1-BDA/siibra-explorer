import { Component } from '@angular/core'
import { PureContantService } from 'src/util';

@Component({
  selector: 'iav-about',
  templateUrl: './about.template.html',
  styleUrls: [
    './about.style.css',
  ],
})

export class AboutCmp {
  public contactEmailHref: string = `mailto:${this.constantService.supportEmailAddress}?Subject=[InteractiveAtlasViewer]%20Queries`
  public supportEmailAddress: string = this.constantService.supportEmailAddress

  public userDoc: string = this.constantService.docUrl
  public repoUrl = this.constantService.repoUrl

  constructor(
    private constantService: PureContantService,
  ) {
  }
}
