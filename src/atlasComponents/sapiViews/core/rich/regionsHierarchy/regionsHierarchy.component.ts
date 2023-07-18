import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output, ViewChild } from "@angular/core";
import { UntypedFormControl } from "@angular/forms";
import { Subscription } from "rxjs";
import { debounceTime, distinctUntilChanged, filter, startWith } from "rxjs/operators";
import { SxplrRegion } from "src/atlasComponents/sapi/sxplrTypes";
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
  TXT_CANNOT_BE_SELECTED = "Not mapped in this template space."

  static IsParent(region: SxplrRegion, parentRegion: SxplrRegion): boolean {
    return region.parentIds.some(id => parentRegion.id === id)
  }

  static FilterRegions(regions: SxplrRegion[], searchTerm: string): SxplrRegion[]{
    if (searchTerm === '' || !searchTerm) {
      return regions
    }
    return regionTreeFilterPipe.transform(
      regions,
      region => filterByRegexPipe.transform([ region.name ], searchTerm),
      region => regions.filter(child => SapiViewsCoreRichRegionsHierarchy.IsParent(child, region))
    )
  }

  @Input('sxplr-sapiviews-core-rich-regionshierarchy-label-mapped-region-names')
  labelMappedRegionNames: string[] = []

  @Input('sxplr-sapiviews-core-rich-regionshierarchy-accent-regions')
  accentedRegions: SxplrRegion[] = []

  @Input('sxplr-sapiviews-core-rich-regionshierarchy-placeholder')
  placeholderText: string = 'Search all regions'

  passedRegions: SxplrRegion[] = []

  private _regions: SxplrRegion[] = []
  get regions(){
    return this._regions
  }
  @Input('sxplr-sapiviews-core-rich-regionshierarchy-regions')
  set regions(val: SxplrRegion[]){
    this._regions = val
    this.passedRegions = SapiViewsCoreRichRegionsHierarchy.FilterRegions(
      this._regions,
      this.searchTerm
    )
  }

  @Output('sxplr-sapiviews-core-rich-regionshierarchy-region-select')
  selectRegion = new EventEmitter<SxplrRegion>()

  @Output('sxplr-sapiviews-core-rich-regionshierarchy-region-toggle')
  toggleRegion = new EventEmitter<SxplrRegion>()

  @ViewChild(SxplrFlatHierarchyTreeView)
  treeView: SxplrFlatHierarchyTreeView<SxplrRegion>

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
  
  onNodeClick({node: roi, event }: {node: SxplrRegion, event: MouseEvent}){
    /**
     * Only allow the regions that are labelled mapped to be selected.
     */
    if (!this.labelMappedRegionNames.includes(roi.name)) {
      return
    }
    if (event.ctrlKey) {
      this.toggleRegion.emit(roi)
    } else {
      this.selectRegion.emit(roi)
    }
  }
}
