import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, HostBinding, Input, Output, QueryList, ViewChildren, inject } from "@angular/core";
import { BehaviorSubject, combineLatest, concat, merge, of } from "rxjs";
import { debounceTime, map, switchMap, takeUntil } from "rxjs/operators";
import { SxplrAtlas, SxplrParcellation, SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes";
import { FilterGroupedParcellationPipe, GroupedParcellation } from "src/atlasComponents/sapiViews/core/parcellation";
import { SmartChip } from "src/components/smartChip";
import { DestroyDirective } from "src/util/directives/destroy.directive";

export const darkThemePalette = [
  "#141414",
  "#242424",
  "#333333",
]

export const lightThemePalette = [
  "#ffffff",
  "#fafafa",
  "#f5f5f5",
]

export type ATP = {
  atlas: SxplrAtlas
  template: SxplrTemplate
  parcellation: SxplrParcellation
}

function isATPGuard(atp: Record<string, unknown>): atp is Partial<ATP> {
  const { atlas, template, parcellation } = atp
  if (atlas && atlas["type"] === "SxplrAtlas") return true
  if (template && template["type"] === "SxplrTemplate") return true
  if (parcellation && parcellation["type"] === "SxplrParcellation") return true
  return false
}

const pipe = new FilterGroupedParcellationPipe()


@Component({
  selector: 'sxplr-pure-atp-selector',
  templateUrl: `./pureATPSelector.template.html`,
  styleUrls: [
    `./pureATPSelector.style.scss`
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    DestroyDirective
  ]
})

export class PureATPSelector implements AfterViewInit{

  #onDestroy$ = inject(DestroyDirective).destroyed$

  @Input('sxplr-pure-atp-selector-color-palette')
  colorPalette: string[] = darkThemePalette

  @Input("sxplr-pure-atp-selector-minimized")
  minimized = true

  #selectedATP$ = new BehaviorSubject<ATP>(null)
  @Input(`sxplr-pure-atp-selector-selected-atp`)
  set selectedATP(val: ATP){
    this.#selectedATP$.next(val)
  }

  public selectedIds: string[] = []

  @Input(`sxplr-pure-atp-selector-atlases`)
  public allAtlases: SxplrAtlas[] = []

  #availableTemplates$ = new BehaviorSubject<SxplrTemplate[]>([])
  @Input(`sxplr-pure-atp-selector-templates`)
  set availableTemplates(val: SxplrTemplate[]){
    this.#availableTemplates$.next(val)
  }

  #parcellations$ = new BehaviorSubject<SxplrParcellation[]>([])
  @Input(`sxplr-pure-atp-selector-parcellations`)
  set parcellations(val: SxplrParcellation[]){
    this.#parcellations$.next(val)
  }

  @Input('sxplr-pure-atp-selector-is-busy')
  public isBusy: boolean = false

  @Output('sxplr-pure-atp-selector-on-select')
  selectLeafEmitter = new EventEmitter<Partial<ATP>>()

  @ViewChildren(SmartChip)
  smartChips: QueryList<SmartChip<object>>

  #menuOpen$ = new BehaviorSubject<{ some: boolean, all: boolean, none: boolean }>({ some: false, all: false, none: false })

  @Output('sxplr-pure-atp-selector-menu-open')
  menuOpen$ = this.#menuOpen$.asObservable()

  @HostBinding('attr.data-menu-open')
  menuOpen: 'some'|'all'|'none' = null

  getChildren(parc: GroupedParcellation|SxplrParcellation){
    return (parc as GroupedParcellation).parcellations || []
  }

  selectLeaf(atp: Record<string, unknown>) {
    if (this.isBusy) return
    if (!isATPGuard(atp)) return
    this.selectLeafEmitter.emit(atp)
  }

  view$ = combineLatest([
    this.#selectedATP$,
    this.#parcellations$,
    this.#availableTemplates$,
  ]).pipe(
    map(([{ atlas, parcellation, template }, parcellations, availableTemplates]) => {
      const parcAndGroup = [
        ...pipe.transform(parcellations || [], true),
        ...pipe.transform(parcellations || [], false),
      ]
      const selectedIds = [atlas?.id, parcellation?.id, template?.id].filter(v => !!v)

      const hideParcChip = this.minimized && parcAndGroup.length <= 1
      const hideTmplChip = this.minimized && availableTemplates?.length <= 1
      
      return {
        atlas,
        parcellation,
        template,
        parcAndGroup,
        parcellations,
        selectedIds,
        hideParcChip,
        hideTmplChip,
        availableTemplates: availableTemplates || [],
      }
    })
  )

  ngAfterViewInit(): void {
    concat(
      of(null),
      this.smartChips.changes,
    ).pipe(
      switchMap(() =>
        combineLatest(
          Array.from(this.smartChips).map(chip =>
            concat(
              of(false),
              merge(
                chip.menuOpened.pipe(
                  map(() => true)
                ),
                chip.menuClosed.pipe(
                  map(() => false)
                )
              )
            )
          )
        )
      ),
      debounceTime(0),
      takeUntil(this.#onDestroy$)
    ).subscribe(arr => {
      const newVal = {
        some: arr.some(val => val),
        all: arr.every(val => val),
        none: arr.every(val => !val),
      }
      this.#menuOpen$.next(newVal)

      this.menuOpen = null
      if (newVal.none) {
        this.menuOpen = 'none'
      }
      if (newVal.all) {
        this.menuOpen = 'all'
      }
      if (newVal.some) {
        this.menuOpen = 'some'
      }
    })
  }

}
