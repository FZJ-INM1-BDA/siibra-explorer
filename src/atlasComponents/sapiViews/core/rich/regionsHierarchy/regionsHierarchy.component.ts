import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output, ViewChild } from "@angular/core";
import { UntypedFormControl } from "@angular/forms";
import { Subscription } from "rxjs";
import { debounceTime, distinctUntilChanged, filter, startWith } from "rxjs/operators";
import { SapiRegionModel } from "src/atlasComponents/sapi/type";
import { SxplrFlatHierarchyTreeView } from "src/components/flatHierarchy/treeView/treeView.component";
import { FilterByRegexPipe } from "./filterByRegex.pipe";
import { RegionTreeFilterPipe } from "./regionTreeFilter.pipe";

const regionTreeFilterPipe = new RegionTreeFilterPipe()
const filterByRegexPipe = new FilterByRegexPipe()

@Component({
  selector: `sxplr-sapiviews-core-rich-regionshierarchy`,
  templateUrl: './regionsHierarchy.template.html',
  styleUrls: [
    `./regionsHierarchy.style.css`
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class SapiViewsCoreRichRegionsHierarchy {

  static IsParent(region: SapiRegionModel, parentRegion: SapiRegionModel) {
    return region.hasParent?.some(parent => parent['@id'] === parentRegion["@id"])
  }

  static FilterRegions(regions: SapiRegionModel[], searchTerm: string): SapiRegionModel[]{
    if (searchTerm === '' || !searchTerm) {
      return regions
    }
    return regionTreeFilterPipe.transform(
      regions,
      region => filterByRegexPipe.transform([ region.name ], searchTerm),
      region => regions.filter(child => SapiViewsCoreRichRegionsHierarchy.IsParent(child, region))
    )
  }

  @Input('sxplr-sapiviews-core-rich-regionshierarchy-accent-regions')
  accentedRegions: SapiRegionModel[] = []

  @Input('sxplr-sapiviews-core-rich-regionshierarchy-placeholder')
  placeholderText: string = 'Search all regions'

  passedRegions: SapiRegionModel[] = []

  private _regions: SapiRegionModel[] = []
  get regions(){
    return this._regions
  }
  @Input('sxplr-sapiviews-core-rich-regionshierarchy-regions')
  set regions(val: SapiRegionModel[]){
    this._regions = val
    this.passedRegions = SapiViewsCoreRichRegionsHierarchy.FilterRegions(
      this._regions,
      this.searchTerm
    )
  }

  @Output('sxplr-sapiviews-core-rich-regionshierarchy-region-select')
  nodeClicked = new EventEmitter<SapiRegionModel>()

  @ViewChild(SxplrFlatHierarchyTreeView)
  treeView: SxplrFlatHierarchyTreeView<SapiRegionModel>

  isParent = SapiViewsCoreRichRegionsHierarchy.IsParent

  searchFormControl = new UntypedFormControl()
  
  searchTerm: string

  constructor(
    private cdr: ChangeDetectorRef
  ){
    this.subs.push(
      this.searchFormControl.valueChanges.pipe(
        startWith(''),
        distinctUntilChanged(),
        debounceTime(320),
        /**
         * empty string should trigger search
         * showing all regions
         */
        filter(val => val === '' || !!val)
      ).subscribe(val => {
        this.searchTerm = val
        this.passedRegions = SapiViewsCoreRichRegionsHierarchy.FilterRegions(
          this._regions,
          this.searchTerm
        )
        this.cdr.markForCheck()
      })
    )
  }

  private subs: Subscription[] = []
  
}
