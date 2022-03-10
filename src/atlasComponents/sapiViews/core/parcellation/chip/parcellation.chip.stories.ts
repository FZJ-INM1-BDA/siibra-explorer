import { CommonModule } from "@angular/common"
import { HttpClientModule } from "@angular/common/http"
import { Meta, moduleMetadata, Story } from "@storybook/angular"
import { SAPI, SapiParcellationModel } from "src/atlasComponents/sapi"
import { atlasId, getAtlas, provideDarkTheme, getParc } from "src/atlasComponents/sapi/stories.base"
import { AngularMaterialModule } from "src/sharedModules"
import { SapiViewsCoreParcellationModule } from "../module"
import { SapiViewsCoreParcellationParcellationChip } from "./parcellation.chip.component"


export default {
  component: SapiViewsCoreParcellationParcellationChip,
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        HttpClientModule,
        SapiViewsCoreParcellationModule,
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

const Template: Story<SapiViewsCoreParcellationParcellationChip> = (args: SapiViewsCoreParcellationParcellationChip, { loaded, parameters }) => {
  const { 
    parcellation
  } = loaded
  const {
    contentProjection
  } = parameters

  return ({
    props: {
      ...args,
      parcellation
    },
    template: `
    <sxplr-sapiviews-core-parcellation-chip>
      ${contentProjection || ''}
    </sxplr-sapiviews-core-parcellation-chip>
    `
  })
}
Template.loaders = []

const asyncLoader = async (_atlasId: string) => {
  const parcs: SapiParcellationModel[] = []
  const atlasDetail = await getAtlas(_atlasId)
  
  for (const parc of atlasDetail.parcellations) {
    const parcDetail = await getParc(atlasDetail['@id'], parc['@id'])
    parcs.push(parcDetail)
  }
  return {
    parcs
  }
}

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
    const {
      parcs
    } = await asyncLoader(atlasId.human)
    return {
      parcellation: parcs[0]
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
