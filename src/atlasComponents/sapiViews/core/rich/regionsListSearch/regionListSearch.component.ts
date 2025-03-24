import { ChangeDetectionStrategy, Component, ContentChild, EventEmitter, HostListener, Input, Output, TemplateRef, ViewChild, inject } from "@angular/core";
import { SxplrRegion } from "src/atlasComponents/sapi/sxplrTypes";
import { ARIA_LABELS } from "common/constants"
import { FormControl } from "@angular/forms";
import { debounceTime, distinctUntilChanged, filter, map, shareReplay, takeUntil } from "rxjs/operators";
import { MatAutocompleteSelectedEvent } from 'src/sharedModules/angularMaterial.exports'
import { SapiViewsCoreRichRegionListTemplateDirective } from "./regionListSearchTmpl.directive";
import { BehaviorSubject, combineLatest, concat, of } from "rxjs";
import { DestroyDirective } from "src/util/directives/destroy.directive";
import { MatAutocompleteTrigger } from "@angular/material/autocomplete";

const filterRegionViaSearch = (searchTerm: string) => (region:SxplrRegion) => {
  return region.name.toLocaleLowerCase().includes(searchTerm.toLocaleLowerCase())
}

type RegionExtra = {
  extra: {
    showMore?: true
    noneFound?: true
  }
}

function isExtra(input: unknown): input is RegionExtra{
  return !!(input['extra'])
}

function filterGetIsNotExtra(input: SxplrRegion|string|RegionExtra): input is SxplrRegion|string{
  return !isExtra(input)
}

@Component({
  selector: `sxplr-sapiviews-core-rich-regionlistsearch`,
  templateUrl: './regionListSearch.template.html',
  styleUrls: [
    `./regionListSearch.style.css`
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: "sapiRegionListSearch",
  hostDirectives: [
    DestroyDirective,
  ]
})

export class SapiViewsCoreRichRegionListSearch {

  readonly #ondestroy$ = inject(DestroyDirective).destroyed$

  ARIA_LABELS = ARIA_LABELS

  // n.b. showing all regions drastically degrade oblique slicing 
  // of parcellations with high number (>1k) nodes, e.g. AMBA ccfv3 2017
  showNOptions = 50

  #regions = new BehaviorSubject<SxplrRegion[]>([])
  @Input('sxplr-sapiviews-core-rich-regionlistsearch-regions')
  set regions(reg: SxplrRegion[]) {
    this.#regions.next(reg)
  }

  @ViewChild(MatAutocompleteTrigger)
  autoComplete: MatAutocompleteTrigger

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

  @Output('sxplr-sapiviews-core-rich-regionlistsearch-region-select-extra')
  onRegionShowCustomSearch = new EventEmitter<string>()

  #searchTerm: string = ""

  constructor(){
    this.searchTerm$.pipe(
      takeUntil(this.#ondestroy$)
    ).subscribe(searchTerm => {
      if (typeof searchTerm === "string") {
        this.#searchTerm = searchTerm
        return
      }
    })
  }

  public searchFormControl = new FormControl<string|SxplrRegion|RegionExtra>(null)

  searchTerm$ = this.searchFormControl.valueChanges.pipe(
    filter(filterGetIsNotExtra),
    distinctUntilChanged(),
    debounceTime(160),
  )

  searchTermString$ = this.searchTerm$.pipe(
    map(val => {
      if (typeof val === "string") {
        return val
      }
      if (isExtra(val)) {
        return null
      }
      return val.name
    }),
    filter(val => val !== null),
    shareReplay(1),
  )

  public searchedList$ = combineLatest([
    concat(
      of(''),
      this.searchTerm$,
    ),
    this.#regions,
  ]).pipe(
    map(([searchTerm, regions]) => {
      let searchString = ""
      if (typeof searchTerm === "string") {
        searchString = searchTerm
      } else {
        searchString = searchTerm.name
      }
      return regions.filter(filterRegionViaSearch(searchString))
    })
  )

  public autocompleteList$ = this.searchedList$.pipe(
    debounceTime(160),
    map(v => v.slice(0, this.showNOptions))
  )

  displayFn(region: SxplrRegion){
    return region?.name || ''
  }

  optionSelected(opt: MatAutocompleteSelectedEvent) {
    this.searchFormControl.setValue('')

    const selectedRegion = opt.option.value as (SxplrRegion | RegionExtra)
    if (isExtra(selectedRegion)) {
      if (selectedRegion.extra.noneFound) {
        this.onRegionShowCustomSearch.emit("")
        return
      }
      if (selectedRegion.extra.showMore) {
        this.onRegionShowCustomSearch.emit(this.#searchTerm || "")
        return
      }
      
      return
    }
    
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

  dismissAutoComplete(){
    this.autoComplete?.closePanel()
  }
}
