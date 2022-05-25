import { CommonModule } from "@angular/common"
import { HttpClientModule } from "@angular/common/http"
import { provideMockStore } from "@ngrx/store/testing"
import { action } from "@storybook/addon-actions"
import { Meta, moduleMetadata, Story } from "@storybook/angular"
import { SAPI } from "src/atlasComponents/sapi"
import { InterSpaceCoordXformSvc } from "src/atlasComponents/sapi/core/space/interSpaceCoordXform.service"
import { spaceId, provideDarkTheme, getHumanAtlas, getMni152, getJba29, getSpace, atlasId, getParc, parcId } from "src/atlasComponents/sapi/stories.base"
import { AngularMaterialModule } from "src/sharedModules"
import { atlasSelection } from "src/state"
import { SapiViewsCoreAtlasModule } from "../module"
import { SapiViewsCoreAtlasAtlasTmplParcSelector } from "./tmplParcSelector.component"

const actionsData = {
  selectTemplate: action('selectTemplate'),
  selectParcellation: action('selectParcellation')
}

export default {
  component: SapiViewsCoreAtlasAtlasTmplParcSelector,
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        HttpClientModule,
        SapiViewsCoreAtlasModule,
        AngularMaterialModule,
      ],
      providers: [
        SAPI,
        InterSpaceCoordXformSvc,
        ...provideDarkTheme,
      ],
      declarations: [
      ]
    })
  ],
} as Meta

const Template: Story<SapiViewsCoreAtlasAtlasTmplParcSelector> = (args: SapiViewsCoreAtlasAtlasTmplParcSelector, { loaded }) => {
  const { 
    atlas,
    template,
    parcellation,
  } = loaded

  return ({
    props: {
      selectTemplate: actionsData.selectTemplate,
      selectParcellation: actionsData.selectParcellation
    },
    moduleMetadata: {
      providers: [
        provideMockStore({
          initialState: {
            [atlasSelection.nameSpace]: {
              ...atlasSelection.defaultState,
              selectedAtlas: atlas,
              selectedTemplate: template,
              selectedParcellation: parcellation,
            }
          }
        })
      ]
    }
  })
}
Template.loaders = [

]

export const MNI152JBA29 = Template.bind({})
MNI152JBA29.args = {
  
}
MNI152JBA29.loaders = [
  async () => {
    const atlas = await getHumanAtlas()
    const template = await getMni152()
    const parcellation = await getJba29()
    return {
      atlas,
      template,
      parcellation,
    }
  }
]

export const BigBrainJBA29 = Template.bind({})
BigBrainJBA29.args = {
  
}
BigBrainJBA29.loaders = [
  async () => {
    const atlas = await getHumanAtlas()
    const template = await getSpace(atlasId.human, spaceId.human.bigbrain)
    const parcellation = await getJba29()
    return {
      atlas,
      template,
      parcellation,
    }
  }
]

export const BigBrainCorticalLayers = Template.bind({})
BigBrainCorticalLayers.args = {
  
}
BigBrainCorticalLayers.loaders = [
  async () => {
    const atlas = await getHumanAtlas()
    const template = await getSpace(atlasId.human, spaceId.human.bigbrain)
    const parcellation = await getParc(atlasId.human, parcId.human.corticalLayers)
    return {
      atlas,
      template,
      parcellation,
    }
  }
]

export const MNI152LongBundle = Template.bind({})
MNI152LongBundle.args = {
  
}
MNI152LongBundle.loaders = [
  async () => {
    const atlas = await getHumanAtlas()
    const template = await getMni152()
    const parcellation = await getParc(atlasId.human, parcId.human.longBundle)
    return {
      atlas,
      template,
      parcellation,
    }
  }
]