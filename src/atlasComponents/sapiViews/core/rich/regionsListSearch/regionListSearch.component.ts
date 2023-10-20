import { ChangeDetectionStrategy, Component, ContentChild, EventEmitter, HostListener, Input, Output, TemplateRef } from "@angular/core";
import { SxplrRegion } from "src/atlasComponents/sapi/sxplrTypes";
import { ARIA_LABELS } from "common/constants"
import { UntypedFormControl } from "@angular/forms";
import { debounceTime, distinctUntilChanged, map, startWith } from "rxjs/operators";
import { MatAutocompleteSelectedEvent } from 'src/sharedModules/angularMaterial.exports'
import { SapiViewsCoreRichRegionListTemplateDirective } from "./regionListSearchTmpl.directive";
import { BehaviorSubject, combineLatest } from "rxjs";

const filterRegionViaSearch = (searchTerm: string) => (region:SxplrRegion) => {
  return region.name.toLocaleLowerCase().includes(searchTerm.toLocaleLowerCase())
}

@Component({
  selector: `sxplr-sapiviews-core-rich-regionlistsearch`,
  templateUrl: './regionListSearch.template.html',
  styleUrls: [
    `./regionListSearch.style.css`
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class SapiViewsCoreRichRegionListSearch {

  ARIA_LABELS = ARIA_LABELS

  showNOptions = 4

  #regions = new BehaviorSubject<SxplrRegion[]>([])
  @Input('sxplr-sapiviews-core-rich-regionlistsearch-regions')
  set regions(reg: SxplrRegion[]) {
    this.#regions.next(reg)
  }

  #mappedRegionNames = new BehaviorSubject<string[]>([])
  @Input('sxplr-sapiviews-core-rich-regionlistsearch-mapped-region-names')
  set mappedRegions(regNames: string[]) {
    this.#mappedRegionNames.next(regNames)
  }

  @ContentChild(SapiViewsCoreRichRegionListTemplateDirective)
  regionTmplDirective: SapiViewsCoreRichRegionListTemplateDirective

  @Input('sxplr-sapiviews-core-rich-regionlistsearch-region-template-ref')
  regionTemplateRef: TemplateRef<any>

  @Input('sxplr-sapiviews-core-rich-regionlistsearch-current-search')
  currentSearch: string = ''

  @Output('sxplr-sapiviews-core-rich-regionlistsearch-region-select')
  onOptionSelected = new EventEmitter<SxplrRegion>()
  
  @Output('sxplr-sapiviews-core-rich-regionlistsearch-region-toggle')
  onRegionToggle = new EventEmitter<SxplrRegion>()

  public searchFormControl = new UntypedFormControl()

  public searchedList$ = combineLatest([
    this.searchFormControl.valueChanges.pipe(
      startWith(''),
      distinctUntilChanged(),
      debounceTime(160),
    ),
    this.#regions,
    this.#mappedRegionNames
  ]).pipe(
    map(([searchTerm, regions, mappedRegionNames]) => {
      if (typeof searchTerm === "string") {
        return regions.filter(r => mappedRegionNames.includes(r.name)).filter(filterRegionViaSearch(searchTerm))
      }
      return []
    })
  )

  public autocompleteList$ = this.searchedList$.pipe(
    map(list => list.slice(0, this.showNOptions))
  )

  displayFn(region: SxplrRegion){
    return region?.name || ''
  }

  optionSelected(opt: MatAutocompleteSelectedEvent) {
    const selectedRegion = opt.option.value as SxplrRegion
    if (this.ctrlFlag) {
      this.onRegionToggle.emit(selectedRegion)
    } else {
      this.onOptionSelected.emit(selectedRegion)
    }
  }

  ctrlFlag = false

  @HostListener('document:keydown', ['$event'])
  keydown(event: KeyboardEvent) {
    this.ctrlFlag = event.ctrlKey
  }
  
  @HostListener('document:keyup', ['$event'])
  keyup(event: KeyboardEvent) {
    this.ctrlFlag = event.ctrlKey
  }
}
