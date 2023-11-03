import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewChild } from "@angular/core";
import { FormControl } from "@angular/forms";
import { BehaviorSubject, combineLatest, concat, from, of, timer } from "rxjs";
import { debounceTime, filter, map, shareReplay, switchMap, take, takeUntil, tap } from "rxjs/operators";
import { SxplrRegion } from "src/atlasComponents/sapi/sxplrTypes";
import { SxplrFlatHierarchyTreeView } from "src/components/flatHierarchy/treeView/treeView.component";
import { AtlasWorkerService } from "src/atlasViewer/atlasViewer.workerService.service";

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

  @Input('sxplr-sapiviews-core-rich-regionshierarchy-label-mapped-region-names')
  labelMappedRegionNames: string[] = []

  @Input('sxplr-sapiviews-core-rich-regionshierarchy-accent-regions')
  accentedRegions: SxplrRegion[] = []

  @Input('sxplr-sapiviews-core-rich-regionshierarchy-placeholder')
  placeholderText: string = 'Search all regions'

  @Input('sxplr-sapiviews-core-rich-regionshierarchy-searchstring')
  set initialSearchTerm(val: string) {
    this.#initialSearchTerm.next(val)
  }
  #initialSearchTerm = new BehaviorSubject<string>(null)

  #allAvailableRegions$ = new BehaviorSubject<SxplrRegion[]>([])
  @Input('sxplr-sapiviews-core-rich-regionshierarchy-regions')
  set regions(val: SxplrRegion[]){
    this.#allAvailableRegions$.next(val)
  }

  @Output('sxplr-sapiviews-core-rich-regionshierarchy-region-select')
  selectRegion = new EventEmitter<SxplrRegion>()

  @Output('sxplr-sapiviews-core-rich-regionshierarchy-region-toggle')
  toggleRegion = new EventEmitter<SxplrRegion>()

  @ViewChild(SxplrFlatHierarchyTreeView)
  treeView: SxplrFlatHierarchyTreeView<SxplrRegion>

  isParent = SapiViewsCoreRichRegionsHierarchy.IsParent

  searchFormControl = new FormControl<string>('')

  searchTerm$ = concat(
    of(null as string),
    this.#initialSearchTerm.pipe(
      filter(v => !!v),
      take(1),
      tap(val => {
        if (val) {
          this.searchFormControl.setValue(val)
        }
      }),
      takeUntil(timer(160)),
    ),
    this.searchFormControl.valueChanges,
  ).pipe(
    shareReplay(1),
  )

  #filteredRegions$ = combineLatest([
    this.searchTerm$,
    this.#allAvailableRegions$,
  ]).pipe(
    debounceTime(320),
    switchMap(([ searchTerm, regions ]) => {
      return from(
        this.worker.sendMessage({
          method: "FILTER_REGIONS",
          param: { regions, searchTerm }
        })
      ).pipe(
        map(({ result }) => {
          const { filteredRegions } = result
          const { regions, dups } = filteredRegions as Record<string, SxplrRegion[]>
          return { regions, dups }
        })
      )
    }),
    shareReplay(1)
  )
  
  passedRegions$ = this.#filteredRegions$.pipe(
    map(({ regions }) => regions)
  )

  constructor(private worker: AtlasWorkerService){}

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
