import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { action } from "@storybook/addon-actions";
import { componentWrapperDecorator, Meta, moduleMetadata, Story } from "@storybook/angular";
import { atlasId, provideDarkTheme } from "src/atlasComponents/sapi/stories.base";
import { SapiAtlasModel, SapiParcellationModel, SapiSpaceModel } from "src/atlasComponents/sapi/type";
import { UtilModule } from "src/util";
import { ATPSelectorModule } from "../module";
import { defaultColorPalette } from "./pureATPSelector.components"
import { loadAtlasEtcData, wrapperDecoratorFn } from "../story.base"
import { provideMockStore } from "@ngrx/store/testing";

@Component({
  selector: 'atlas-selector-wrapper-story',
  template: 
  `<sxplr-pure-atp-selector
    [sxplr-pure-atp-selector-color-palette]="[atlasColor, spaceColor, parcellationColor]"
    [sxplr-pure-atp-selector-selected-atp]="selectedATP"
    [sxplr-pure-atp-selector-atlases]="allAtlases"
    [sxplr-pure-atp-selector-templates]="availableTemplates"
    [sxplr-pure-atp-selector-parcellations]="parcs"
    [sxplr-pure-atp-selector-is-busy]="isBusy"
    (sxplr-pure-atp-selector-on-select)="selectLeaf($event)"
    >
    <button mat-icon-button
      (click)="toggleParcellationVisibility()"
      parcellation-chip-suffix
      iav-stop="mousedown click">
      <i class="fas fa-eye"></i>
    </button>
  </sxplr-pure-atp-selector>`,
  styles: [
    `[parcellation-chip-suffix]
    {
      margin-right: -1rem;
      margin-left: 0.2rem;
    }`
  ]
})
class AtlasLayerSelectorWrapper {
  atlasColor: string = defaultColorPalette[0]
  spaceColor: string = defaultColorPalette[1]
  parcellationColor: string = defaultColorPalette[2]
  allAtlases: SapiAtlasModel[]
  availableTemplates: SapiSpaceModel[]
  selectedATP: {
    atlas: SapiAtlasModel
    parcellation: SapiParcellationModel
    template: SapiSpaceModel
  }
  parcs: SapiParcellationModel[]
  isBusy: boolean = false

  selectLeaf(arg: {
    atlas: SapiAtlasModel
    parcellation: SapiParcellationModel
    template: SapiSpaceModel
  }) {}

  toggleParcellationVisibility() {

  }
}

export default {
  component: AtlasLayerSelectorWrapper,
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        ATPSelectorModule,
        MatButtonModule,
        UtilModule,
      ],
      declarations: [
        AtlasLayerSelectorWrapper
      ],
      providers: [
        ...provideDarkTheme,
        provideMockStore(),
      ]
    }),
    componentWrapperDecorator(wrapperDecoratorFn)
  ]
} as Meta

const Template: Story<AtlasLayerSelectorWrapper> = (args: AtlasLayerSelectorWrapper, { loaded }) => {
  
  const {
    combinedAtlas,
    atlases
  } = loaded
  const { atlas, parcs, spaces } = combinedAtlas
  const selectedATP = {
    atlas, parcellation: parcs[0], template: spaces[0]
  }
  const {
    atlasColor,
    spaceColor,
    parcellationColor,
  } = args
  return ({
    props: {
      ...args,
      allAtlases: atlases,
      parcs,
      availableTemplates: spaces,
      selectedATP: {
        atlas,
        parcellation: parcs[0],
        template: spaces[0]
      },
      selectLeaf: action(`selectLeaf`),
      toggleParcellationVisibility: action('toggleParcellationVisibility'),
      atlasColor,
      spaceColor,
      parcellationColor,
    }
  })
}

export const Default = Template.bind({})
Default.args = {
  atlasColor: defaultColorPalette[0],
  spaceColor: defaultColorPalette[1],
  parcellationColor: defaultColorPalette[2],
}
Default.loaders = [
  async () => {
    const {
      atlases,
      combinedAtlases
    } = await loadAtlasEtcData()
    
    return {
      atlases,
      combinedAtlas: combinedAtlases.filter(v => v.atlas["@id"] === atlasId.human)[0]
    }
  }
]
