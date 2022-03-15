import { CommonModule } from "@angular/common"
import { HttpClientModule } from "@angular/common/http"
import { Meta, moduleMetadata, Story } from "@storybook/angular"
import { SAPI, SapiParcellationModel } from "src/atlasComponents/sapi"
import { atlasId, getAtlas, provideDarkTheme, getParc, getHumanAtlas, getJba29, getMni152, getHoc1Left, get44Left } from "src/atlasComponents/sapi/stories.base"
import { AngularMaterialModule } from "src/sharedModules"
import { SapiViewsCoreRegionModule } from "../../module"
import { SapiViewsCoreRegionRegionChip } from "./region.chip.component"


export default {
  component: SapiViewsCoreRegionRegionChip,
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
        ...provideDarkTheme,
      ],
      declarations: []
    })
  ],
} as Meta

const Template: Story<SapiViewsCoreRegionRegionChip> = (args: SapiViewsCoreRegionRegionChip, { loaded, parameters }) => {
  const { 
    atlas,
    parcellation,
    template,
    region,
  } = loaded
  const {
    contentProjection
  } = parameters

  return ({
    props: {
      atlas,
      parcellation,
      template,
      region,
    },
    template: `
    <sxplr-sapiviews-core-region-region-chip>
      ${contentProjection || ''}
    </sxplr-sapiviews-core-region-region-chip>
    `
  })
}
Template.loaders = []

const getContentProjection = ({ prefix = null, suffix = null }) => {
  let returnVal = ``
  if (prefix) {
    returnVal += `<div prefix>${prefix}</div>`
  }
  if (suffix) {
    returnVal += `<div suffix>${suffix}</div>`
  }
  return returnVal
}

export const Default = Template.bind({})
Default.loaders = [
  async () => {
    
    const atlas = await getHumanAtlas()
    const parcellation = await getJba29()
    const template = await getMni152()
    const region = await getHoc1Left()

    return {
      atlas,
      parcellation,
      template,
      region,
    }
  }
]

export const Dark = Template.bind({})
Dark.loaders = [
  async () => {
    
    const atlas = await getHumanAtlas()
    const parcellation = await getJba29()
    const template = await getMni152()
    const region = await get44Left()

    return {
      atlas,
      parcellation,
      template,
      region,
    }
  }
]

export const Prefix = Template.bind({})
Prefix.loaders = [
  ...Default.loaders
]
Prefix.parameters = {
  contentProjection: getContentProjection({
    prefix: `PREFIX`,
  })
}

export const Suffix = Template.bind({})
Suffix.loaders = [
  ...Default.loaders
]
Suffix.parameters = {
  contentProjection: getContentProjection({
    suffix: `SUFFIX`,
  })
}


export const PrefixSuffix = Template.bind({})
PrefixSuffix.loaders = [
  ...Default.loaders
]
PrefixSuffix.parameters = {
  contentProjection: getContentProjection({
    prefix: `PREFIX`,
    suffix: `SUFFIX`,
  })
}
