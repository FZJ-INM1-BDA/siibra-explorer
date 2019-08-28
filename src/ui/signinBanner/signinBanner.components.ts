import {Component, ChangeDetectionStrategy, OnDestroy, OnInit, Input, ViewChild, TemplateRef } from "@angular/core";
import { AtlasViewerConstantsServices } from "src/atlasViewer/atlasViewer.constantService.service";
import { AuthService, User } from "src/services/auth.service";
import { Store} from "@ngrx/store";
import { ViewerConfiguration } from "src/services/state/viewerConfig.store";
import { safeFilter, isDefined, NEWVIEWER, SELECT_REGIONS, SELECT_PARCELLATION, CHANGE_NAVIGATION } from "src/services/stateStore.service";

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

  public isMobile: boolean

  constructor(
    private constantService: AtlasViewerConstantsServices,
    private authService: AuthService,
    private store: Store<ViewerConfiguration>
  ){
    this.isMobile = this.constantService.mobile
  }

  showHelp() {
    this.constantService.showHelpSubject$.next()
  }

  showSignin() {
    this.constantService.showSigninSubject$.next(this.user)
  }

  get user() : User | null {
    return this.authService.user
  }
}