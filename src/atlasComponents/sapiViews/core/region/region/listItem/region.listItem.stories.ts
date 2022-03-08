import { CommonModule } from "@angular/common"
import { HttpClientModule } from "@angular/common/http"
import { Meta, moduleMetadata, Story } from "@storybook/angular"
import { SAPI } from "src/atlasComponents/sapi"
import { getHoc1Left, getHumanAtlas, getJba29, getMni152, provideDarkTheme } from "src/atlasComponents/sapi/stories.base"
import { SapiViewsCoreRegionModule } from "../../module"
import { SapiViewsCoreRegionRegionListItem } from "./region.listItem.component"

export default {
  component: SapiViewsCoreRegionRegionListItem,
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        HttpClientModule,
        SapiViewsCoreRegionModule,
      ],
      providers: [
        SAPI,
        ...provideDarkTheme,
      ],
      declarations: []
    })
  ],
} as Meta

const Template: Story<SapiViewsCoreRegionRegionListItem> = (args: SapiViewsCoreRegionRegionListItem, { loaded, parameters }) => {
  const { 
    human,
    mni152,
    jba29,
    hoc1left
  } = loaded

  const { contentProjection } = parameters
  return ({
    props: {
      ...args,
      atlas: human, 
      template: mni152, 
      parcellation: jba29, 
      region:  hoc1left,
      ripple: true
    },
    template: `
    <sxplr-sapiviews-core-region-region-list-item>
      ${contentProjection || ''}
    </sxplr-sapiviews-core-region-region-list-item>
    `
  })
}

const loadRegions = async () => {
  
  const human = await getHumanAtlas()
  const mni152 = await getMni152()
  const jba29 = await getJba29()
  const hoc1left = await getHoc1Left(mni152["@id"])

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


const getPrefixSuffix = (prefix: string, suffix: string) => {
  let returnVal = ``
  if (prefix) {
    returnVal += `<div prefix>${prefix}</div>`
  }
  if (suffix) {
    returnVal += `<div suffix>${suffix}</div>`
  }
  return returnVal
}

export const HeaderContentProjectionPrefix = Template.bind({})
HeaderContentProjectionPrefix.loaders = [
  ...HumanMni152Jba29Hoc1Left.loaders
]
HeaderContentProjectionPrefix.parameters = {
  contentProjection: getPrefixSuffix(`<i class="far fa-square"></i>`, null)
}

export const HeaderContentProjectionSuffix = Template.bind({})
HeaderContentProjectionSuffix.loaders = [
  ...HumanMni152Jba29Hoc1Left.loaders
]
HeaderContentProjectionSuffix.parameters = {
  contentProjection: getPrefixSuffix(null, `<i class="fab fa-chrome"></i>`)
}

export const HeaderContentProjectionBox = Template.bind({})
HeaderContentProjectionBox.loaders = [
  ...HumanMni152Jba29Hoc1Left.loaders
]
HeaderContentProjectionBox.parameters = {
  contentProjection: getPrefixSuffix(`TEXT`, `<button mat-raised-button>test button</button>`)
}
