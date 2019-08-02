import { EventEmitter, Component, ElementRef, ViewChild, HostListener, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Input, Output, AfterViewInit } from "@angular/core";
import {  Subscription, Subject, fromEvent } from "rxjs";
import { buffer, debounceTime } from "rxjs/operators";
import { FilterNameBySearch } from "./filterNameBySearch.pipe";
import { generateLabelIndexId } from "src/services/stateStore.service";

const insertHighlight :(name:string, searchTerm:string) => string = (name:string, searchTerm:string = '') => {
  const regex = new RegExp(searchTerm, 'gi')
  return searchTerm === '' ?
    name :
    name.replace(regex, (s) => `<span class = "highlight">${s}</span>`)
}

const getDisplayTreeNode : (searchTerm:string, selectedRegions:any[]) => (item:any) => string = (searchTerm:string = '', selectedRegions:any[] = []) => ({ ngId, name, status, labelIndex }) =>  {
  return !!labelIndex
    && !!ngId
    && selectedRegions.findIndex(re =>
      generateLabelIndexId({ labelIndex: re.labelIndex, ngId: re.ngId }) === generateLabelIndexId({ ngId, labelIndex })
    ) >= 0
      ? `<span class="regionSelected">${insertHighlight(name, searchTerm)}</span>` + (status ? ` <span class="text-muted">(${insertHighlight(status, searchTerm)})</span>` : ``)
      : `<span class="regionNotSelected">${insertHighlight(name, searchTerm)}</span>` + (status ? ` <span class="text-muted">(${insertHighlight(status, searchTerm)})</span>` : ``)
}

const getFilterTreeBySearch = (pipe:FilterNameBySearch, searchTerm:string) => (node:any) => pipe.transform([node.name, node.status], searchTerm)

@Component({
  selector: 'region-hierarchy',
  templateUrl: './regionHierarchy.template.html',
  styleUrls: [
    './regionHierarchy.style.css'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class RegionHierarchy implements OnInit, AfterViewInit{

  @Input()
  public selectedRegions: any[] = []

  @Input()
  public selectedParcellation: any

  @Input() isMobile: boolean;

  private _showRegionTree: boolean = false

  @Output()
  private showRegionFlagChanged: EventEmitter<boolean> = new EventEmitter()

  @Output()
  private singleClickRegion: EventEmitter<any> = new EventEmitter()

  @Output()
  private doubleClickRegion: EventEmitter<any> = new EventEmitter()

  @Output()
  private clearAllRegions: EventEmitter<null> = new EventEmitter()

  public searchTerm: string = ''
  private subscriptions: Subscription[] = []

  @ViewChild('searchTermInput', { read: ElementRef})
  private searchTermInput: ElementRef

  /**
   * set the height to max, bound by max-height
   */
  numTotalRenderedRegions: number = 999
  windowHeight: number

  @HostListener('document:click', ['$event'])
  closeRegion(event: MouseEvent) {
    const contains = this.el.nativeElement.contains(event.target)
    this.showRegionTree = contains
    if (!this.showRegionTree){
      this.searchTerm = ''
      this.numTotalRenderedRegions = 999
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.windowHeight = event.target.innerHeight;
  }

  get regionsLabelIndexMap() {
    return null
  }

  constructor(
    private cdr:ChangeDetectorRef,
    private el:ElementRef
  ){
    this.windowHeight = window.innerHeight;
  }

  ngOnChanges(){
    this.aggregatedRegionTree = {
      name: this.selectedParcellation.name,
      children: this.selectedParcellation.regions
    }
    this.displayTreeNode = getDisplayTreeNode(this.searchTerm, this.selectedRegions)
    this.filterTreeBySearch = getFilterTreeBySearch(this.filterNameBySearchPipe, this.searchTerm)
  }

  clearRegions(event:MouseEvent){
    event.stopPropagation()
    this.clearAllRegions.emit()
  }

  get showRegionTree(){
    return this._showRegionTree
  }

  set showRegionTree(flag: boolean){
    this._showRegionTree = flag
    this.showRegionFlagChanged.emit(this._showRegionTree)
  }

  ngOnInit(){
    this.displayTreeNode = getDisplayTreeNode(this.searchTerm, this.selectedRegions)
    this.filterTreeBySearch = getFilterTreeBySearch(this.filterNameBySearchPipe, this.searchTerm)

    this.subscriptions.push(
      this.handleRegionTreeClickSubject.pipe(
        buffer(
          this.handleRegionTreeClickSubject.pipe(
            debounceTime(200)
          )
        )
      ).subscribe(arr => arr.length > 1 ? this.doubleClick(arr[0]) : this.singleClick(arr[0]))
    )
  }

  ngAfterViewInit(){
    /**
     * TODO
     * bandaid fix on
     * when region search loses focus, the searchTerm is cleared,
     * but hierarchy filter does not reset
     */
    this.subscriptions.push(
      fromEvent(this.searchTermInput.nativeElement, 'focus').pipe(
        
      ).subscribe(() => {
        this.displayTreeNode = getDisplayTreeNode(this.searchTerm, this.selectedRegions)
        this.filterTreeBySearch = getFilterTreeBySearch(this.filterNameBySearchPipe, this.searchTerm)
      })
    )
    this.subscriptions.push(
      fromEvent(this.searchTermInput.nativeElement, 'input').pipe(
        debounceTime(200)
      ).subscribe(ev => {
        this.changeSearchTerm(ev)
      })
    )
  }

  getInputPlaceholder(parcellation:any) {
    if (parcellation)
      return `Search region in ${parcellation.name}`
    else
      return `Start by selecting a template and a parcellation.`
  }

  escape(event:KeyboardEvent){
    this.showRegionTree = false
    this.searchTerm = '';
    (event.target as HTMLInputElement).blur()

  }

  handleTotalRenderedListChanged(changeEvent: {previous: number, current: number}){
    const { current } = changeEvent
    this.numTotalRenderedRegions = current
  }

  regionHierarchyHeight(){
    return({
      'height' : (this.numTotalRenderedRegions * 15 + 60).toString() + 'px',
      'max-height': (this.windowHeight - 100) + 'px'
    })
  }

  focusInput(event?:MouseEvent){
    if (event) {
      /**
       * need to stop propagation, or @closeRegion will be triggered
       */
      event.stopPropagation()
    }
    this.searchTermInput.nativeElement.focus()
    this.showRegionTree = true
  }

  /* NB need to bind two way data binding like this. Or else, on searchInput blur, the flat tree will be rebuilt,
    resulting in first click to be ignored */

  changeSearchTerm(event: any) {
    if (event.target.value === this.searchTerm)
      return
    this.searchTerm = event.target.value
    /**
     * TODO maybe introduce debounce
     */
    this.ngOnChanges()
    this.cdr.markForCheck()
  }

  private handleRegionTreeClickSubject: Subject<any> = new Subject()

  handleClickRegion(obj: any) {
    const {event} = obj
    /**
     * TODO figure out why @closeRegion gets triggered, but also, contains returns false
     */
    if (event)
      event.stopPropagation()
    this.handleRegionTreeClickSubject.next(obj)
  }

  /* single click selects/deselects region(s) */
  private singleClick(obj: any) {
    if (!obj)
      return
    const { inputItem : region } = obj
    if (!region)
      return
    this.singleClickRegion.emit(region)
  }

  /* double click navigate to the interested area */
  private doubleClick(obj: any) {
    if (!obj)
      return
    const { inputItem : region } = obj
    if (!region)
      return
    this.doubleClickRegion.emit(region)
  }

  public displayTreeNode: (item:any) => string

  private filterNameBySearchPipe = new FilterNameBySearch()
  public filterTreeBySearch: (node:any) => boolean 

  public aggregatedRegionTree: any

}