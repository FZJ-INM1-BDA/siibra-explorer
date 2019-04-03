import { Component, ChangeDetectionStrategy, OnDestroy } from "@angular/core";
import { AtlasViewerConstantsServices } from "src/atlasViewer/atlasViewer.constantService.service";
import { AuthService, User, AuthMethod } from "src/services/auth.service";
import { Store, select } from "@ngrx/store";
import { ViewerConfiguration } from "src/services/state/viewerConfig.store";
import { Subscription, Observable } from "rxjs";
import { safeFilter, isDefined, NEWVIEWER } from "src/services/stateStore.service";
import { map, filter, distinctUntilChanged } from "rxjs/operators";

@Component({
  selector: 'signin-banner',
  templateUrl: './signinBanner.template.html',
  styleUrls: [
    './signinBanner.style.css',
    '../btnShadow.style.css'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class SigninBanner implements OnDestroy{

  private subscriptions: Subscription[] = []
  public loadedTemplates$: Observable<any[]>
  public selectedTemplate$: Observable<any>

  constructor(
    private constantService: AtlasViewerConstantsServices,
    private authService: AuthService,
    private store: Store<ViewerConfiguration>
  ){
    this.loadedTemplates$ = this.store.pipe(
      select('viewerState'),
      safeFilter('fetchedTemplates'),
      map(state => state.fetchedTemplates)
    )

    this.selectedTemplate$ = this.store.pipe(
      select('viewerState'),
      filter(state => isDefined(state) && isDefined(state.templateSelected)),
      distinctUntilChanged((o, n) => o.templateSelected.name === n.templateSelected.name),
      map(state => state.templateSelected)
    )
  }

  ngOnDestroy(){
    this.subscriptions.forEach(s => s.unsubscribe())
  }

  changeTemplate({ current, previous }){
    if (previous && current && current.name === previous.name)
      return
    this.store.dispatch({
      type: NEWVIEWER,
      selectTemplate: current,
      selectParcellation: current.parcellations[0]
    })
  }

  displayActiveTemplate(template: any) {
    return `<small>Template</small> <small class = "mute-text">${template ? '(' + template.name + ')' : ''}</small> <span class = "caret"></span>`
  }

  showHelp() {
    this.constantService.showHelpSubject$.next()
  }

  showConfig() {
    this.constantService.showConfigSubject$.next()
  }

  showSignin() {
    this.constantService.showSigninSubject$.next(this.user)
  }

  get isMobile(){
    return this.constantService.mobile
  }

  get user() : User | null {
    return this.authService.user
  }
}