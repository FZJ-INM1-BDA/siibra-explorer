import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { SapiAtlasModel, SapiParcellationModel, SapiSpaceModel } from "src/atlasComponents/sapi/type";
import { FilterGroupedParcellationPipe, GroupedParcellation } from "src/atlasComponents/sapiViews/core/parcellation";

export const defaultColorPalette = [
  "#480202",
  "#6b1205",
  "#921d1d",
]

export type ATP = {
  atlas: SapiAtlasModel
  template: SapiSpaceModel
  parcellation: SapiParcellationModel
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
  colorPalette: string[] = defaultColorPalette

  @Input(`sxplr-pure-atp-selector-selected-atp`)
  public selectedATP: ATP

  public selectedIds: string[] = []

  @Input(`sxplr-pure-atp-selector-atlases`)
  public allAtlases: SapiAtlasModel[] = []

  @Input(`sxplr-pure-atp-selector-templates`)
  public availableTemplates: SapiSpaceModel[] = []

  @Input(`sxplr-pure-atp-selector-parcellations`)
  public parcellations: SapiParcellationModel[] = []

  public parcAndGroup: (GroupedParcellation|SapiParcellationModel)[] = []

  @Input('sxplr-pure-atp-selector-is-busy')
  public isBusy: boolean = false

  @Output('sxplr-pure-atp-selector-on-select')
  selectLeafEmitter = new EventEmitter<ATP>()

  getChildren(parc: GroupedParcellation|SapiParcellationModel){
    return (parc as GroupedParcellation).parcellations || []
  }

  selectLeaf(atp: ATP) {
    if (this.isBusy) return
    this.selectLeafEmitter.emit(atp)
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.selectedATP) {
      if (!changes.selectedATP.currentValue) {
        this.selectedIds = []
      } else {
        const { atlas, parcellation, template } = changes.selectedATP.currentValue as ATP
        this.selectedIds = [atlas?.["@id"], parcellation?.["@id"], template?.["@id"]].filter(v => !!v)
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
