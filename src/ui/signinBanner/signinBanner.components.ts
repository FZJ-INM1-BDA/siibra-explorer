import { Component, ChangeDetectionStrategy, OnDestroy, OnInit, Input } from "@angular/core";
import { AtlasViewerConstantsServices } from "src/atlasViewer/atlasViewer.constantService.service";
import { AuthService, User } from "src/services/auth.service";
import { Store, select } from "@ngrx/store";
import { ViewerConfiguration } from "src/services/state/viewerConfig.store";
import { Subscription, Observable } from "rxjs";
import { safeFilter, isDefined, NEWVIEWER, SELECT_REGIONS, SELECT_PARCELLATION } from "src/services/stateStore.service";
import { map, filter, distinctUntilChanged } from "rxjs/operators";
import { regionFlattener } from "src/util/regionFlattener";

@Component({
  selector: 'signin-banner',
  templateUrl: './signinBanner.template.html',
  styleUrls: [
    './signinBanner.style.css',
    '../btnShadow.style.css'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class SigninBanner implements OnInit, OnDestroy{

  private subscriptions: Subscription[] = []
  public loadedTemplates$: Observable<any[]>
  public selectedTemplate$: Observable<any>
  public selectedParcellation$: Observable<any>
  public selectedRegions$: Observable<any[]>
  private selectedRegions: any[] = []
  @Input() darktheme: boolean

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

    this.selectedParcellation$ = this.store.pipe(
      select('viewerState'),
      safeFilter('parcellationSelected'),
      map(state => state.parcellationSelected),
      distinctUntilChanged((o, n) => o === n || (o && n && o.name === n.name)),
    )

    this.selectedRegions$ = this.store.pipe(
      select('viewerState'),
      safeFilter('regionsSelected'),
      map(state => state.regionsSelected),
      distinctUntilChanged((arr1, arr2) => arr1.length === arr2.length && (arr1 as any[]).every((item, index) => item.name === arr2[index].name))
    )
  }

  ngOnInit(){

    this.subscriptions.push(
      this.selectedRegions$.subscribe(regions => {
        this.selectedRegions = regions
      })
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

  changeParcellation({ current, previous }){
    const { ngId: prevNgId} = previous
    const { ngId: currNgId} = current
    if (prevNgId === currNgId)
      return
    this.store.dispatch({
      type: SELECT_PARCELLATION,
      selectParcellation: current
    })
  }

  handleRegionClick({ mode = 'single', region }){
    if (!region)
      return
    const flattenedRegion = regionFlattener(region).filter(r => isDefined(r.labelIndex))
    const flattenedRegionNames = new Set(flattenedRegion.map(r => r.name))
    const selectedRegionNames = new Set(this.selectedRegions.map(r => r.name))
    const selectAll = flattenedRegion.every(r => !selectedRegionNames.has(r.name))
    this.store.dispatch({
      type: SELECT_REGIONS,
      selectRegions: selectAll
        ? this.selectedRegions.concat(flattenedRegion)
        : this.selectedRegions.filter(r => !flattenedRegionNames.has(r.name))
    })
  }

  displayActiveParcellation(parcellation:any){
    return `<div class="d-flex"><small>Parcellation</small> <small class = "flex-grow-1 mute-text">${parcellation ? '(' + parcellation.name + ')' : ''}</small> <span class = "fas fa-caret-down"></span></div>`
  }

  displayActiveTemplate(template: any) {
    return `<div class="d-flex"><small>Template</small> <small class = "flex-grow-1 mute-text">${template ? '(' + template.name + ')' : ''}</small> <span class = "fas fa-caret-down"></span></div>`
  }

  showHelp() {
    this.constantService.showHelpSubject$.next()
  }

  showSignin() {
    this.constantService.showSigninSubject$.next(this.user)
  }

  clearAllRegions(){
    this.store.dispatch({
      type: SELECT_REGIONS,
      selectRegions: []
    })
  }

  get isMobile(){
    return this.constantService.mobile
  }

  get user() : User | null {
    return this.authService.user
  }
}