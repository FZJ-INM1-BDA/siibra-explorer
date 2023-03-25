import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { SxplrAtlas, SxplrParcellation, SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes";
import { FilterGroupedParcellationPipe, GroupedParcellation } from "src/atlasComponents/sapiViews/core/parcellation";

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
})

export class PureATPSelector implements OnChanges{

  @Input('sxplr-pure-atp-selector-color-palette')
  colorPalette: string[] = darkThemePalette

  @Input(`sxplr-pure-atp-selector-selected-atp`)
  public selectedATP: ATP

  public selectedIds: string[] = []

  @Input(`sxplr-pure-atp-selector-atlases`)
  public allAtlases: SxplrAtlas[] = []

  @Input(`sxplr-pure-atp-selector-templates`)
  public availableTemplates: SxplrTemplate[] = []

  @Input(`sxplr-pure-atp-selector-parcellations`)
  public parcellations: SxplrParcellation[] = []

  public parcAndGroup: (GroupedParcellation|SxplrParcellation)[] = []

  @Input('sxplr-pure-atp-selector-is-busy')
  public isBusy: boolean = false

  @Output('sxplr-pure-atp-selector-on-select')
  selectLeafEmitter = new EventEmitter<Partial<ATP>>()

  getChildren(parc: GroupedParcellation|SxplrParcellation){
    return (parc as GroupedParcellation).parcellations || []
  }

  selectLeaf(atp: Record<string, unknown>) {
    if (this.isBusy) return
    if (!isATPGuard(atp)) return
    this.selectLeafEmitter.emit(atp)
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.selectedATP) {
      if (!changes.selectedATP.currentValue) {
        this.selectedIds = []
      } else {
        const { atlas, parcellation, template } = changes.selectedATP.currentValue as ATP
        this.selectedIds = [atlas?.id, parcellation?.id, template?.id].filter(v => !!v)
      }
    }

    if (changes.parcellations) {
      if (!changes.parcellations.currentValue) {
        this.parcAndGroup = []
      } else {
        this.parcAndGroup = [
          ...pipe.transform(changes.parcellations.currentValue, true),
          ...pipe.transform(changes.parcellations.currentValue, false),
        ]
      }
    }
  }
}
