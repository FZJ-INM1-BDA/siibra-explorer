import { Directive, Input, OnChanges, SimpleChanges } from "@angular/core";
import { GroupedFeature } from "./category-acc.directive";
import { combineLatest, Subject } from "rxjs";
import { map } from "rxjs/operators";

@Directive({
  selector: '[filter-grp-feat]',
  exportAs: 'filterGrpFeat'
})
export class FilterGroupList implements OnChanges{

  @Input()
  featureDisplayName: string[] = []
  #featureDisplayName = new Subject<string[]>()

  @Input()
  groupFeature: GroupedFeature[] = []
  #groupFeature = new Subject<GroupedFeature[]>()

  filteredFeatures$ = combineLatest([
    this.#featureDisplayName,
    this.#groupFeature
  ]).pipe(
    map(([ displaynames, grpfeats ]) => grpfeats.filter(feat => displaynames.includes(feat.meta.displayName)).flatMap(f => f.features))
  )

  ngOnChanges(): void {
    this.#featureDisplayName.next(this.featureDisplayName)
    this.#groupFeature.next(this.groupFeature)
  }
}
