import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output, ViewChild } from "@angular/core";
import { UntypedFormControl } from "@angular/forms";
import { Subscription } from "rxjs";
import { debounceTime, distinctUntilChanged, filter, startWith } from "rxjs/operators";
import { SxplrRegion } from "src/atlasComponents/sapi/sxplrTypes";
import { translateV3Entities } from "src/atlasComponents/sapi/translateV3"
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

  static IsParent(region: SxplrRegion, parentRegion: SxplrRegion): boolean {
    const _region = translateV3Entities.retrieveRegion(region)
    const _parentRegion = translateV3Entities.retrieveRegion(parentRegion)
    const { ["@id"]: parentRegionId } = _parentRegion
    return _region.hasParent?.some(parent => {
      const { ["@id"]: pId } = parent
      return pId === parentRegionId
    })
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
  nodeClicked = new EventEmitter<SxplrRegion>()

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
  
}
