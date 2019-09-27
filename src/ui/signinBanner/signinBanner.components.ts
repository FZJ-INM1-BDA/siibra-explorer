import {Component, ChangeDetectionStrategy, Input, TemplateRef } from "@angular/core";
import { AtlasViewerConstantsServices } from "src/atlasViewer/atlasViewer.constantService.service";
import { AuthService, User } from "src/services/auth.service";
import { MatDialog } from "@angular/material";


@Component({
  selector: 'signin-banner',
  templateUrl: './signinBanner.template.html',
  styleUrls: [
    './signinBanner.style.css',
    '../btnShadow.style.css'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class SigninBanner{

  @Input() darktheme: boolean

  constructor(
    private constantService: AtlasViewerConstantsServices,
    private authService: AuthService,
    private dialog: MatDialog
  ){
  }

  /**
   * move the templates to signin banner when pluginprettify is merged
   */
  showHelp() {
    this.constantService.showHelpSubject$.next()
  }

  /**
   * move the templates to signin banner when pluginprettify is merged
   */
  showSetting(settingTemplate:TemplateRef<any>){
    this.dialog.open(settingTemplate, {
      autoFocus: false
    })
  }

  /**
   * move the templates to signin banner when pluginprettify is merged
   */
  showSignin() {
    this.constantService.showSigninSubject$.next(this.user)
  }

  get user() : User | null {
    return this.authService.user
  }
}