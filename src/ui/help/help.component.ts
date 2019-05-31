import { Component } from '@angular/core'
import { AtlasViewerConstantsServices } from 'src/atlasViewer/atlasViewer.constantService.service';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'help-component',
  templateUrl: './help.template.html',
  styleUrls: [
    './help.style.css'
  ]
})

export class HelpComponent{

  public generalHelp
  public sliceviewHelp
  public perspectiveviewHelp
  public supportText

  constructor(
    private constantService:AtlasViewerConstantsServices,
    private sanitizer:DomSanitizer
  ){
    this.generalHelp = this.constantService.showHelpGeneralMap
    this.sliceviewHelp = this.constantService.showHelpSliceViewMap
    this.perspectiveviewHelp = this.constantService.showHelpPerspectiveViewMap
    this.supportText = this.sanitizer.bypassSecurityTrustHtml(this.constantService.showHelpSupportText)
  }
}