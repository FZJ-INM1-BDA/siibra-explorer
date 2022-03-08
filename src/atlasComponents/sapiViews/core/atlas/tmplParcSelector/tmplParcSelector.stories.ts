import { CommonModule } from "@angular/common"
import { HttpClientModule } from "@angular/common/http"
import { provideMockStore } from "@ngrx/store/testing"
import { action } from "@storybook/addon-actions"
import { Meta, moduleMetadata, Story } from "@storybook/angular"
import { SAPI, SapiSpaceModel } from "src/atlasComponents/sapi"
import { atlasId, spaceId, getAtlas, getSpace, provideDarkTheme, getHumanAtlas } from "src/atlasComponents/sapi/stories.base"
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
        ...provideDarkTheme,
      ],
      declarations: [
      ]
    })
  ],
} as Meta

const Template: Story<SapiViewsCoreAtlasAtlasTmplParcSelector> = (args: SapiViewsCoreAtlasAtlasTmplParcSelector, { loaded }) => {
  const { 
    atlas
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
              selectedAtlas: atlas
            }
          }
        })
      ]
    }
  })
}
Template.loaders = [

]

const asyncLoader = async () => {
  const atlas = await getHumanAtlas()
  return {
    atlas
  }
}

export const Default = Template.bind({})
Default.args = {
  selected: spaceId.human.mni152
}
Default.loaders = [

  async () => {
    const {
      atlas
    } = await asyncLoader()
    return {
      atlas
    }
  }
]
