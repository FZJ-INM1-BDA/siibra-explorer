import { CommonModule } from "@angular/common"
import { HttpClientModule } from "@angular/common/http"
import { Meta, moduleMetadata, Story } from "@storybook/angular"
import { SAPI } from "src/atlasComponents/sapi"
import { getHoc1Right, getHumanAtlas, getJba29, getJba29Regions, getMni152, provideDarkTheme } from "src/atlasComponents/sapi/stories.base"
import { SapiViewsCoreRegionModule } from "../../module"
import { SapiViewsCoreRegionRegionRich } from "./region.rich.component"
import { action } from '@storybook/addon-actions';
import {CUSTOM_ELEMENTS_SCHEMA} from "@angular/core";
import {AngularMaterialModule} from "src/sharedModules";
import {provideMockStore} from "@ngrx/store/testing";

const actionsData = {
  onNavigateTo: action('onNavigateTo'),
  onHandleRegionalFeatureClicked: action('onHandleRegionalFeatureClicked')
}

export default {
  component: SapiViewsCoreRegionRegionRich,
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        HttpClientModule,
        SapiViewsCoreRegionModule,
        AngularMaterialModule,
      ],
      providers: [
        SAPI,
        provideMockStore(),
        ...provideDarkTheme,
      ],
      schemas: [
        CUSTOM_ELEMENTS_SCHEMA,
      ],
      declarations: []
    })
  ],
} as Meta

const Template: Story<SapiViewsCoreRegionRegionRich> = (args: SapiViewsCoreRegionRegionRich, { loaded, parameters }) => {
  const { 
    human,
    mni152,
    jba29,
    hoc1left
  } = loaded

  const { contentProjection } = parameters
  return ({
    props: {
      atlas: human, 
      template: mni152, 
      parcellation: jba29, 
      region:  hoc1left,
      navigateTo: actionsData.onNavigateTo,
      handleRegionalFeatureClicked: actionsData.onHandleRegionalFeatureClicked
    },
    template: `
    <sxplr-sapiviews-core-region-region-rich>
      ${contentProjection || ''}
    </sxplr-sapiviews-core-region-region-rich>
    `
  })
}

const loadRegions = async () => {
  
  const human = await getHumanAtlas()
  const mni152 = await getMni152()
  const jba29 = await getJba29()
  const hoc1left = await getHoc1Right(mni152["@id"])
  return {
    human,
    mni152,
    jba29,
    hoc1left,
  }
}

export const HumanMni152Jba29Hoc1Left = Template.bind({})
HumanMni152Jba29Hoc1Left.args = {

}
HumanMni152Jba29Hoc1Left.loaders = [
  async () => {
    const {
      human,
      mni152,
      jba29,
      hoc1left,
    } = await loadRegions()
    return {
      human,
      mni152,
      jba29,
      hoc1left,
    }
  }
]


export const HeaderContentProjection = Template.bind({})
HeaderContentProjection.loaders = [
  ...HumanMni152Jba29Hoc1Left.loaders
]
HeaderContentProjection.parameters = {
  contentProjection: `<div header>HEADER CONTENT PROJECTED</div>`
}

export const InjectionSimpleRegion = Template.bind({})
InjectionSimpleRegion.loaders = [
  ...HumanMni152Jba29Hoc1Left.loaders,
  async () => {
    const regions = await getJba29Regions()
    const hoc1left = regions.find(r => /left/i.test(r.name) && /hoc1/i.test(r.name))
    return {
      hoc1left
    }
  }
]
