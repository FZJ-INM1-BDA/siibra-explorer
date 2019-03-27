import { Component, OnDestroy, ChangeDetectionStrategy, ViewChild, ElementRef, OnInit } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { ViewerStateInterface, safeFilter, SELECT_PARCELLATION, SELECT_REGIONS, NEWVIEWER, isDefined } from "../../services/stateStore.service";
import { Observable, Subscription } from "rxjs";
import { map, filter, debounceTime, distinctUntilChanged } from "rxjs/operators";
import { regionAnimation } from "./regionPopover.animation";
import { AtlasViewerConstantsServices } from "../../atlasViewer/atlasViewer.constantService.service"
import { AuthService, User, AuthMethod } from "src/services/auth.service";

@Component({
  selector: 'atlas-banner',
  templateUrl: './banner.template.html',
  styleUrls: [
    `./banner.style.css`,
    '../../css/darkBtns.css'
  ],
  animations: [
    regionAnimation
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class AtlasBanner implements OnDestroy, OnInit {

  public loadedTemplates$: Observable<any[]>
  public newViewer$: Observable<any>
  public selectedParcellation$: Observable<any>

  public selectedTemplate: any
  public selectedParcellation: any
  // private navigation: { position: [number, number, number] } = { position: [0, 0, 0] }

  private subscriptions: Subscription[] = []

  @ViewChild('templateCitationAnchor', { read: ElementRef }) templateCitationAnchor: ElementRef
  @ViewChild('parcellationCitationAnchor', { read: ElementRef }) parcellationCitationAnchor: ElementRef

  searchTerm: string = ''

  constructor(
    private store: Store<ViewerStateInterface>,
    private constantService: AtlasViewerConstantsServices,
    private authService: AuthService
  ) {
    this.loadedTemplates$ = this.store.pipe(
      select('viewerState'),
      safeFilter('fetchedTemplates'),
      map(state => state.fetchedTemplates))

    this.newViewer$ = this.store.pipe(
      select('viewerState'),
      filter(state => isDefined(state) && isDefined(state.templateSelected)),
      distinctUntilChanged((o, n) => o.templateSelected.name === n.templateSelected.name)
    )

    this.selectedParcellation$ = this.store.pipe(
      select('viewerState'),
      safeFilter('parcellationSelected'),
      map(state => state.parcellationSelected),
      distinctUntilChanged((o, n) => o === n)
    )

  }

  ngOnInit() {
    this.subscriptions.push(
      this.newViewer$.subscribe((state) => {
        this.selectedTemplate = state.templateSelected
        const selectedParcellation = state.parcellationSelected ? state.parcellationSelected : this.selectedTemplate.parcellations[0]
      })
    )

    this.subscriptions.push(
      this.newViewer$.pipe(
        debounceTime(250)
      ).subscribe(() => {
        if (this.templateCitationAnchor)
          this.templateCitationAnchor.nativeElement.click()
      })
    )


    this.subscriptions.push(
      this.selectedParcellation$.pipe(
        debounceTime(250)
      ).subscribe(() => {
        if (this.parcellationCitationAnchor)
          this.parcellationCitationAnchor.nativeElement.click()
      })
    )


    // this.subscriptions.push(
    //   this.store.pipe(
    //     select('viewerState'),
    //     safeFilter('navigation'),
    //     map(obj => obj.navigation)
    //   ).subscribe((navigation: any) => this.navigation = navigation)
    // )
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe())
  }


  get user() : User | null {
    return this.authService.user
  }

  get loginMethods(): AuthMethod[] {
    return this.authService.loginMethods
  }

  get logoutHref(): String {
    return this.authService.logoutHref
  }

  selectTemplate(template: any) {
    if (this.selectedTemplate === template) {
      return
    }

    this.store.dispatch({
      type: NEWVIEWER,
      selectTemplate: template,
      selectParcellation: template.parcellations[0]
    })
  }

  selectParcellation(parcellation: any) {
    if (this.selectedParcellation === parcellation) {
      return
    }
    this.store.dispatch({
      type: SELECT_PARCELLATION,
      selectParcellation: parcellation
    })
  }



  displayActiveTemplate(template: any) {
    return `<small>Template</small> <small class = "mute-text">${template ? '(' + template.name + ')' : ''}</small> <span class = "caret"></span>`
  }

  displayActiveParcellation(parcellation: any) {
    return `<small>Parcellation</small> <small class = "mute-text">${parcellation ? '(' + parcellation.name + ')' : ''}</small> <span class = "caret"></span>`
  }



  getChildren(item: any) {
    return item.children
  }


  clearRegions(event: Event) {
    event.stopPropagation()
    event.preventDefault()
    this.store.dispatch({
      type: SELECT_REGIONS,
      selectRegions: []
    })
  }

  citationExists(obj: any) {
    return obj && obj.properties && obj.properties.publications && obj.properties.publications.length > 0
  }

  showHelp() {
    this.constantService.showHelpSubject$.next()
  }

  showConfig() {
    this.constantService.showConfigSubject$.next()
  }

  loginBtnOnclick() {
    this.authService.authSaveState()
    return true
  }

  get toastDuration() {
    return this.constantService.citationToastDuration
  }

  get isMobile(){
    return this.constantService.mobile
  }
}
