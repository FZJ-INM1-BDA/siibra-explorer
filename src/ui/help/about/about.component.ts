import { Component } from '@angular/core'
import { DomSanitizer } from '@angular/platform-browser';
import { AtlasViewerConstantsServices } from 'src/atlasViewer/atlasViewer.constantService.service';

@Component({
  selector: 'iav-about',
  templateUrl: './about.template.html',
  styleUrls: [
    './about.style.css',
  ],
})

export class AboutCmp {

  public generalHelp = this.constantService.showHelpGeneralMap
  public sliceviewHelp = this.constantService.showHelpSliceViewMap
  public perspectiveviewHelp = this.constantService.showHelpPerspectiveViewMap
  public supportText = this.sanitizer.bypassSecurityTrustHtml(this.constantService.showHelpSupportText)

  public contactEmailHref: string = `mailto:${this.constantService.supportEmailAddress}?Subject=[InteractiveAtlasViewer]%20Queries`
  public supportEmailAddress: string = this.constantService.supportEmailAddress

  public userDoc: string = this.constantService.docUrl
  public repoUrl = this.constantService.repoUrl

  constructor(
    private constantService: AtlasViewerConstantsServices,
    private sanitizer: DomSanitizer,
  ) {
  }
}
