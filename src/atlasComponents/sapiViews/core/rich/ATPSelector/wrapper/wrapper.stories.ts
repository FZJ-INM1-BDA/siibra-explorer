import { Component } from "@angular/core";
import { MatDialogModule } from "@angular/material/dialog";
import { Store } from "@ngrx/store";
import { action } from "@storybook/addon-actions";
import { componentWrapperDecorator, Meta, moduleMetadata, Story } from "@storybook/angular";
import { atlasId, provideDarkTheme } from "src/atlasComponents/sapi/stories.base";
import { atlasSelection, RootStoreModule } from "src/state";
import { ParcellationVisibilityService } from "../../../parcellation/parcellationVis.service";
import { ATPSelectorModule } from "../module";
import { ATP } from "../pureDumb/pureATPSelector.components";
import { loadAtlasEtcData, wrapperDecoratorFn } from "../story.base";

@Component({
  selector: 'wrapper-wrapper',
  template: '<sxplr-wrapper-atp-selector></sxplr-wrapper-atp-selector>'
})
class Wrapper{
  set ATP(atp: ATP) {
    const { atlas, parcellation, template } = atp
    
    this.store$.dispatch(
      atlasSelection.actions.setAtlasSelectionState({
        selectedAtlas: atlas,
        selectedTemplate: template,
        selectedParcellation: parcellation
      })
    )

    this.store$.dispatch = action('dispatch')
  }

  constructor(private store$: Store) {}
}

export default {
  component: Wrapper,
  decorators: [
    moduleMetadata({
      imports: [
        ATPSelectorModule,
        MatDialogModule,
        RootStoreModule,
      ],
      providers: [
        ...provideDarkTheme,
        ParcellationVisibilityService,
      ]
    }),
    componentWrapperDecorator(wrapperDecoratorFn)
  ]
} as Meta

const Template: Story<Wrapper> = (args: Wrapper, { loaded }) => {
  const { combinedAtlas } = loaded
  return {
    props: {
      ...args,
      ATP: {
        atlas: combinedAtlas.atlas,
        parcellation: combinedAtlas.parcs[0],
        template: combinedAtlas.spaces[0],
      }
    }
  }
}

export const Default = Template.bind({})

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
