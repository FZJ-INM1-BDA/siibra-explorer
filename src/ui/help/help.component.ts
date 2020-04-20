import { Component } from '@angular/core'
import { DomSanitizer } from '@angular/platform-browser';
import { AtlasViewerConstantsServices } from 'src/atlasViewer/atlasViewer.constantService.service';

@Component({
  selector: 'help-component',
  templateUrl: './help.template.html',
  styleUrls: [
    './help.style.css',
  ],
})

export class HelpComponent {

  public generalHelp
  public sliceviewHelp
  public perspectiveviewHelp
  public supportText

  public contactEmailHref: string
  public contactEmail: string

  public userDoc: string = `docs/`

  constructor(
    private constantService: AtlasViewerConstantsServices,
    private sanitizer: DomSanitizer,
  ) {
    this.generalHelp = this.constantService.showHelpGeneralMap
    this.sliceviewHelp = this.constantService.showHelpSliceViewMap
    this.perspectiveviewHelp = this.constantService.showHelpPerspectiveViewMap
    this.supportText = this.sanitizer.bypassSecurityTrustHtml(this.constantService.showHelpSupportText)

    this.contactEmailHref = `mailto:${this.constantService.supportEmailAddress}?Subject=[InteractiveAtlasViewer]%20Queries`
    this.contactEmail = this.constantService.supportEmailAddress
  }
}
