import { ChangeDetectionStrategy, Component, ContentChild, EventEmitter, Input, Output, TemplateRef } from "@angular/core";
import { SxplrRegion } from "src/atlasComponents/sapi/type_sxplr";
import { ARIA_LABELS } from "common/constants"
import { UntypedFormControl } from "@angular/forms";
import { debounceTime, distinctUntilChanged, map, startWith } from "rxjs/operators";
import { MatAutocompleteSelectedEvent } from "@angular/material/autocomplete";
import { SapiViewsCoreRichRegionListTemplateDirective } from "./regionListSearchTmpl.directive";

/**
 * Filter function, which determines whether the region will be included in the list of autocompleted search.
 * Ideally, only the selectable regions are included in the result.
 * 
 * @param region input region
 * @returns {boolean} whether or not to include the region in the list search
 */
const filterRegionForListSearch = (region: SxplrRegion): boolean => {
  return !!region.color
}

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

  private _regions: SxplrRegion[] = []
  get regions(){
    return this._regions
  }
  @Input('sxplr-sapiviews-core-rich-regionlistsearch-regions')
  set regions(val: SxplrRegion[]) {
    this._regions = val.filter(filterRegionForListSearch)
  }

  @ContentChild(SapiViewsCoreRichRegionListTemplateDirective)
  regionTmplDirective: SapiViewsCoreRichRegionListTemplateDirective

  @Input('sxplr-sapiviews-core-rich-regionlistsearch-region-template-ref')
  regionTemplateRef: TemplateRef<any>

  @Input('sxplr-sapiviews-core-rich-regionlistsearch-current-search')
  currentSearch: string = ''

  @Output('sxplr-sapiviews-core-rich-regionlistsearch-region-select')
  onOptionSelected = new EventEmitter<SxplrRegion>()

  public searchFormControl = new UntypedFormControl()

  public searchedList$ = this.searchFormControl.valueChanges.pipe(
    startWith(''),
    distinctUntilChanged(),
    debounceTime(160),
    map((searchTerm: string | SxplrRegion) => {
      if (typeof searchTerm === "string") {
        return this.regions.filter(filterRegionViaSearch(searchTerm))
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
    this.onOptionSelected.emit(selectedRegion)
  }
}
