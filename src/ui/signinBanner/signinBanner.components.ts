import {Component, ChangeDetectionStrategy, OnDestroy, OnInit, Input, ViewChild, TemplateRef } from "@angular/core";
import { AtlasViewerConstantsServices } from "src/atlasViewer/atlasViewer.constantService.service";
import { AuthService, User } from "src/services/auth.service";
import { Store, select } from "@ngrx/store";
import { ViewerConfiguration } from "src/services/state/viewerConfig.store";
import { Subscription, Observable, merge, Subject, interval } from "rxjs";
import { safeFilter, isDefined, NEWVIEWER, SELECT_REGIONS, SELECT_PARCELLATION, CHANGE_NAVIGATION } from "src/services/stateStore.service";
import { map, filter, distinctUntilChanged, bufferTime, delay, share, tap } from "rxjs/operators";
import { regionFlattener } from "src/util/regionFlattener";
import { ToastService } from "src/services/toastService.service";
import { getSchemaIdFromName } from "src/util/pipes/templateParcellationDecoration.pipe";

const compareParcellation = (o, n) => o.name === n.name

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

  public compareParcellation = compareParcellation

  private subscriptions: Subscription[] = []
  public loadedTemplates$: Observable<any[]>
  public selectedTemplate$: Observable<any>
  public selectedParcellation$: Observable<any>
  public selectedRegions$: Observable<any[]>
  private selectedRegions: any[] = []
  selectedTemplate: any
  @Input() darktheme: boolean

  @ViewChild('publicationTemplate', {read:TemplateRef}) publicationTemplate: TemplateRef<any>

  public focusedDatasets$: Observable<any[]>
  private userFocusedDataset$: Subject<any> = new Subject()
  public focusedDatasets: any[] = []
  private dismissToastHandler: () => void

  constructor(
    private constantService: AtlasViewerConstantsServices,
    private authService: AuthService,
    private store: Store<ViewerConfiguration>,
    private toastService: ToastService
  ){
    this.loadedTemplates$ = this.store.pipe(
      select('viewerState'),
      safeFilter('fetchedTemplates'),
      map(state => state.fetchedTemplates)
    )

    this.selectedTemplate$ = this.store.pipe(
      select('viewerState'),
      select('templateSelected'),
      filter(v => !!v),
      distinctUntilChanged((o, n) => o.name === n.name),
    )

    this.selectedParcellation$ = this.store.pipe(
      select('viewerState'),
      select('parcellationSelected'),
      filter(v => !!v)
    )

    this.selectedRegions$ = this.store.pipe(
      select('viewerState'),
      safeFilter('regionsSelected'),
      map(state => state.regionsSelected),
      distinctUntilChanged((arr1, arr2) => arr1.length === arr2.length && (arr1 as any[]).every((item, index) => item.name === arr2[index].name))
    )

    this.focusedDatasets$ = merge(
      this.selectedTemplate$.pipe(
        map(v => [v])
      ),
      this.selectedParcellation$.pipe(
        distinctUntilChanged((o, n) => o.name === n.name),
        map(p => {
          if (!p.originDatasets || !p.originDatasets.map) return [p]
          return p.originDatasets.map(od => {
            return {
              ...p,
              ...od
            }
          })
        })
      ),
      this.userFocusedDataset$.pipe(
        filter(v => !!v)
      )
    ).pipe(
      bufferTime(100),
      map(arrOfArr => arrOfArr.reduce((acc, curr) => acc.concat(curr), [])),
      filter(arr => arr.length > 0),
      /**
       * merge properties field with the root level
       * with the prop in properties taking priority
       */
      map(arr => arr.map(item => {
        const { properties } = item
        return {
          ...item,
          ...properties
        }
      })),
      share()
    )
  }

  ngOnInit(){

    this.subscriptions.push(
      this.selectedRegions$.subscribe(regions => {
        this.selectedRegions = regions
      })
    )
    this.subscriptions.push(
      this.selectedTemplate$.subscribe(template => this.selectedTemplate = template)
    )

    this.subscriptions.push(
      this.focusedDatasets$.subscribe(() => {
        if (this.dismissToastHandler) this.dismissToastHandler()
      })
    )

    this.subscriptions.push(
      this.focusedDatasets$.pipe(
        /**
         * creates the illusion that the toast complete disappears before reappearing
         */
        delay(100)
      ).subscribe(arr => {
        this.focusedDatasets = arr
        this.dismissToastHandler = this.toastService.showToast(this.publicationTemplate, {
          dismissable: true,
          timeout:7000
        })
      })
    )
  }

  ngOnDestroy(){
    this.subscriptions.forEach(s => s.unsubscribe())
  }

  changeTemplate({ current, previous }){
    if (previous && current && current.name === previous.name) return
    this.store.dispatch({
      type: NEWVIEWER,
      selectTemplate: current,
      selectParcellation: current.parcellations[0]
    })
  }

  changeParcellation({ current, previous }){
    const { ngId: prevNgId} = previous
    const { ngId: currNgId} = current
    if (prevNgId === currNgId) return
    this.store.dispatch({
      type: SELECT_PARCELLATION,
      selectParcellation: current
    })
  }

  // TODO handle mobile
  handleRegionClick({ mode = 'single', region }){
    if (!region) return
    
    /**
     * single click on region hierarchy => toggle selection
     */
    if (mode === 'single') {
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

    /**
     * double click on region hierarchy => navigate to region area if it exists
     */
    if (mode === 'double') {

      /**
       * if position is defined, go to position (in nm)
       * if not, show error messagea s toast
       * 
       * nb: currently, only supports a single triplet
       */
      if (region.position) {
        this.store.dispatch({
          type: CHANGE_NAVIGATION,
          navigation: {
            position: region.position,
            animation: {}
          }
        })
      } else {
        this.toastService.showToast(`${region.name} does not have a position defined`, {
          timeout: 5000,
          dismissable: true
        })
      }
    }
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

  handleExtraBtnClicked(event, toastType: 'parcellation' | 'template'){
    const { 
      extraBtn,
      inputItem,
      event: extraBtnClickEvent
    } = event

    const { name } = extraBtn
    const { kgSchema, kgId } = getSchemaIdFromName(name)

    this.userFocusedDataset$.next([{
      ...inputItem,
      kgSchema,
      kgId
    }])

    extraBtnClickEvent.stopPropagation()
  }

  get isMobile(){
    return this.constantService.mobile
  }

  get user() : User | null {
    return this.authService.user
  }

  public flexItemIsMobileClass = 'mt-2'
  public flexItemIsDesktopClass = 'mr-2'
}