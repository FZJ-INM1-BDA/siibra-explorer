import { Component, OnDestroy, ChangeDetectionStrategy, HostListener, ViewChild, ElementRef, OnInit } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { ViewerStateInterface, safeFilter, SELECT_PARCELLATION, extractLabelIdx, SELECT_REGIONS, NEWVIEWER, getLabelIndexMap, isDefined, CHANGE_NAVIGATION } from "../../services/stateStore.service";
import { Observable, Subscription, merge, Subject } from "rxjs";
import { map, filter, debounceTime, buffer, distinctUntilChanged } from "rxjs/operators";
import { FilterNameBySearch } from "../../util/pipes/filterNameBySearch.pipe";
import { regionAnimation } from "./regionPopover.animation";
import { AtlasViewerConstantsServices } from "../../atlasViewer/atlasViewer.constantService.service"

@Component({
  selector: 'atlas-banner',
  templateUrl: './banner.template.html',
  styleUrls: [
    `./banner.style.css`
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
  public selectedRegions$: Observable<any[]>

  private regionsLabelIndexMap: Map<number, any> = new Map()

  public selectedTemplate: any
  public selectedParcellation: any
  public selectedRegions: any[] = []
  // private navigation: { position: [number, number, number] } = { position: [0, 0, 0] }

  private subscriptions: Subscription[] = []

  @ViewChild('templateCitationAnchor', { read: ElementRef }) templateCitationAnchor: ElementRef
  @ViewChild('parcellationCitationAnchor', { read: ElementRef }) parcellationCitationAnchor: ElementRef

  searchTerm: string = ''

  constructor(
    private store: Store<ViewerStateInterface>,
    private constantService: AtlasViewerConstantsServices
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

    this.selectedRegions$ = merge(
      this.store.pipe(
        select('viewerState'),
        filter(state => isDefined(state) && isDefined(state.regionsSelected)),
        map(state => state.regionsSelected)
      )
    )
  }

  ngOnInit() {
    this.subscriptions.push(
      this.newViewer$.subscribe((state) => {
        this.selectedTemplate = state.templateSelected
        const selectedParcellation = state.parcellationSelected ? state.parcellationSelected : this.selectedTemplate.parcellations[0]
        this.handleParcellationChange(selectedParcellation)
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
      this.selectedParcellation$.subscribe((this.handleParcellationChange).bind(this))
    )

    this.subscriptions.push(
      this.selectedParcellation$.pipe(
        debounceTime(250)
      ).subscribe(() => {
        if (this.parcellationCitationAnchor)
          this.parcellationCitationAnchor.nativeElement.click()
      })
    )

    this.subscriptions.push(
      this.selectedRegions$.subscribe((ev) => {
        this.selectedRegions = ev
      })
    )

    this.subscriptions.push(
      this.handleRegionTreeClickSubject.pipe(
        buffer(
          this.handleRegionTreeClickSubject.pipe(
            debounceTime(200)
          )
        )
      ).subscribe(arr => arr.length > 1 ? this.doubleClick(arr[0]) : this.singleClick(arr[0]))
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

  handleParcellationChange(parcellation) {
    if (!(parcellation && parcellation.regions)) {
      return
    }
    this.selectedParcellation = parcellation
    this.regionsLabelIndexMap = getLabelIndexMap(parcellation.regions)
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

  /* double click navigate to the interested area */
  private doubleClick(obj: any) {
    if (!(obj && obj.inputItem && (obj.inputItem.position || obj.inputItem.POIs))) {
      return
    }

    const newPos = obj.inputItem.position
      ? obj.inputItem.position
      : obj.inputItem.POIs && obj.inputItem.POIs.constructor === Array && obj.inputItem.POIs.length > 0
        ? obj.inputItem.POIs[0]
        : null

    this.store.dispatch({
      type: CHANGE_NAVIGATION,
      navigation: {
        position: newPos,
        animation: {
          /* empty object is enough to be truthy */
        }
      },
    })
  }

  /* single click selects/deselects region(s) */
  private singleClick(obj: any) {
    const region = obj.inputItem
    const selectedSet = new Set(extractLabelIdx(region))
    const intersection = new Set([...this.selectedRegions.map(r => r.labelIndex)].filter(v => selectedSet.has(v)))
    this.store.dispatch({
      type: SELECT_REGIONS,
      selectRegions: intersection.size > 0 ?
        this.selectedRegions.filter(v => !intersection.has(v.labelIndex)) :
        this.selectedRegions.concat([...selectedSet].map(idx => this.regionsLabelIndexMap.get(idx)))
    })
  }

  private handleRegionTreeClickSubject: Subject<any> = new Subject()

  /* NB need to bind two way data binding like this. Or else, on searchInput blur, the flat tree will be rebuilt,
    resulting in first click to be ignored */
  changeSearchTerm(event: any) {
    if (event.target.value === this.searchTerm)
      return
    this.searchTerm = event.target.value
  }

  @ViewChild('searchRegionPopover', { read: ElementRef }) inputRegionPopover: ElementRef
  public showRegionTree: boolean

  @HostListener('document:click', ['$event'])
  closeRegion(event: MouseEvent) {

    /* region popover may not always be rendered */
    if (!this.inputRegionPopover)
      return

    /* FF < 62 does not implement event.srcElement so use event.originalTarget to polyfill for FF */

    const contains = event.srcElement
      ? this.inputRegionPopover.nativeElement.contains(event.srcElement)
      : this.inputRegionPopover.nativeElement.contains((event as any).originalTarget)
    if (contains)
      this.showRegionTree = true
    else
      this.showRegionTree = false
  }

  handleClickRegion(obj: any) {
    obj.event.stopPropagation()
    this.handleRegionTreeClickSubject.next(obj)
  }

  displayActiveTemplate(template: any) {
    return `<small>Template</small> <small class = "mute-text">${template ? '(' + template.name + ')' : ''}</small> <span class = "caret"></span>`
  }

  displayActiveParcellation(parcellation: any) {
    return `<small>Parcellation</small> <small class = "mute-text">${parcellation ? '(' + parcellation.name + ')' : ''}</small> <span class = "caret"></span>`
  }

  private insertHighlight(name: string, searchTerm: string): string {
    const regex = new RegExp(searchTerm, 'gi')
    return searchTerm === '' ?
      name :
      name.replace(regex, (s) => `<span class = "highlight">${s}</span>`)
  }

  displayTreeNode(item: any) {
    return typeof item.labelIndex !== 'undefined' && this.selectedRegions.findIndex(re => re.labelIndex === Number(item.labelIndex)) >= 0 ?
      `<span class = "regionSelected">${this.insertHighlight(item.name, this.searchTerm)}</span>` :
      `<span class = "regionNotSelected">${this.insertHighlight(item.name, this.searchTerm)}</span>`
  }

  getChildren(item: any) {
    return item.children
  }

  filterTreeBySearch(node: any): boolean {
    return this.filterNameBySearchPipe.transform([node.name], this.searchTerm)
  }

  clearRegions(event: Event) {
    event.stopPropagation()
    event.preventDefault()
    this.store.dispatch({
      type: SELECT_REGIONS,
      selectRegions: []
    })
  }

  filterNameBySearchPipe = new FilterNameBySearch()

  get aggregatedRegionTree() {
    return {
      name: this.selectedParcellation.name,
      children: this.selectedParcellation.regions
    }
  }

  citationExists(obj: any) {
    return obj && obj.properties && obj.properties.publications && obj.properties.publications.length > 0
  }

  showHelp() {
    this.constantService.showHelpSubject$.next()
  }

  get toastDuration() {
    return this.constantService.citationToastDuration
  }

  get isMobile(){
    return this.constantService.mobile
  }
}
