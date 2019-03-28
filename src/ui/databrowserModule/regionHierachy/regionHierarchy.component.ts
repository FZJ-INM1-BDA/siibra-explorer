import { EventEmitter, Component, ElementRef, ViewChild, HostListener, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Input, Output } from "@angular/core";
import {  Subscription, Subject } from "rxjs";
import { buffer, debounceTime } from "rxjs/operators";
import { FilterNameBySearch } from "../filterNameBySearch.pipe";
import { DatabrowserService } from "../databrowser.service";

@Component({
  selector: 'region-hierarchy',
  templateUrl: './regionHierarchy.template.html',
  styleUrls: [
    './regionHierarchy.style.css'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class RegionHierarchy implements OnInit{


  @Input()
  public selectedRegions: any[] = []

  private _showRegionTree: boolean = false

  @Output()
  showRegionFlagChanged: EventEmitter<boolean> = new EventEmitter()

  public searchTerm: string = ''
  private subscriptions: Subscription[] = []

  @ViewChild('searchRegionPopover', { read: ElementRef })
  private searchRegionPopover: ElementRef

  @ViewChild('searchTermInput', {read: ElementRef})
  private searchTermInput: ElementRef

  @HostListener('document:click', ['$event'])
  closeRegion(event: MouseEvent) {
    if (!this.searchRegionPopover)
      return
    const contains = this.searchRegionPopover.nativeElement.contains(event.target)
    this.showRegionTree = contains
    if (!this.showRegionTree)
      this.searchTerm = ''
  }

  get selectedParcellation(){
    return this.dbService.selectedParcellation
  }

  get regionsLabelIndexMap() {
    return this.dbService.regionsLabelIndexMap
  }

  constructor(
    private cdr:ChangeDetectorRef,
    private dbService: DatabrowserService
  ){
  }

  get showRegionTree(){
    return this._showRegionTree
  }

  set showRegionTree(flag: boolean){
    this._showRegionTree = flag
    this.showRegionFlagChanged.emit(this._showRegionTree)
  }

  ngOnInit(){
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
    this.cdr.markForCheck()
  }

  private handleRegionTreeClickSubject: Subject<any> = new Subject()

  handleClickRegion(obj: any) {
    obj.event.stopPropagation()
    this.handleRegionTreeClickSubject.next(obj)
  }

  /* double click navigate to the interested area */
  private doubleClick(obj: any) {
    if (!obj)
      return
    const { inputItem : region } = obj
    if (!region)
      return
    this.dbService.doubleClickRegion(region)
  }

  /* single click selects/deselects region(s) */
  private singleClick(obj: any) {
    this.dbService.singleClickRegion(obj.inputItem)

    /**
     * TODO may no longer be needed
     */
    this.cdr.markForCheck()
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

  filterNameBySearchPipe = new FilterNameBySearch()
  filterTreeBySearch(node: any): boolean {
    return this.filterNameBySearchPipe.transform([node.name], this.searchTerm)
  }

  get aggregatedRegionTree() {
    return {
      name: this.selectedParcellation.name,
      children: this.selectedParcellation.regions
    }
  }
}