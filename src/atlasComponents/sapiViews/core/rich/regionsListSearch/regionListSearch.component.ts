import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, TemplateRef } from "@angular/core";
import { SapiRegionModel } from "src/atlasComponents/sapi/type";
import { ARIA_LABELS } from "common/constants"
import { FormControl } from "@angular/forms";
import { debounceTime, distinctUntilChanged, map, startWith } from "rxjs/operators";
import { MatAutocompleteSelectedEvent } from "@angular/material/autocomplete";

/**
 * Filter function, which determines whether the region will be included in the list of autocompleted search.
 * Ideally, only the selectable regions are included in the result.
 * 
 * @param region input region
 * @returns {boolean} whether or not to include the region in the list search
 */
const filterRegionForListSearch = (region: SapiRegionModel): boolean => {
  const visualizedIn = region.hasAnnotation?.visualizedIn
  return !!visualizedIn
}

const filterRegionViaSearch = (searchTerm: string) => (region:SapiRegionModel) => {
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

  private _regions: SapiRegionModel[] = []
  get regions(){
    return this._regions
  }
  @Input('sxplr-sapiviews-core-rich-regionlistsearch-regions')
  set regions(val: SapiRegionModel[]) {
    this._regions = val.filter(filterRegionForListSearch)
  }

  @Input('sxplr-sapiviews-core-rich-regionlistsearch-region-template-ref')
  regionTemplateRef: TemplateRef<any>

  @Input('sxplr-sapiviews-core-rich-regionlistsearch-current-search')
  currentSearch: string = ''

  @Output('sxplr-sapiviews-core-rich-regionlistsearch-region-select')
  onOptionSelected = new EventEmitter<SapiRegionModel>()

  public searchFormControl = new FormControl()

  public autocompleteList$ = this.searchFormControl.valueChanges.pipe(
    startWith(''),
    distinctUntilChanged(),
    debounceTime(160),
    map((searchTerm: string | SapiRegionModel) => {
      if (typeof searchTerm === "string") {
        return this.regions.filter(filterRegionViaSearch(searchTerm)).slice(0,5)
      }
      return []
    })
  )

  displayFn(region: SapiRegionModel){
    return region?.name || ''
  }

  optionSelected(opt: MatAutocompleteSelectedEvent) {
    const selectedRegion = opt.option.value as SapiRegionModel
    this.onOptionSelected.emit(selectedRegion)
  }
}
