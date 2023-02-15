import { Meta, moduleMetadata, Story } from "@storybook/angular"
import { SAPI, SapiAtlasModel, SapiParcellationModel, SapiRegionModel, SapiSpaceModel } from "src/atlasComponents/sapi"
import { getHoc1Right, getHumanAtlas, getJba29, getMni152, provideDarkTheme, getMni152SpatialFeatureHoc1Right } from "src/atlasComponents/sapi/stories.base"
import { SxplrSapiViewsFeaturesIeegModule } from ".."
import { Component } from "@angular/core"
import { cleanIeegSessionDatasets, SapiSpatialFeatureModel } from "src/atlasComponents/sapi/type"
import { action } from "@storybook/addon-actions"

@Component({
  selector: 'ieeg-entry-wrapper-cmp',
  template: `
  <sxplr-sapiviews-features-ieeg-ieegdataset
    [sxplr-sapiviews-features-ieeg-ieegdataset-atlas]="atlas"
    [sxplr-sapiviews-features-ieeg-ieegdataset-space]="template"
    [sxplr-sapiviews-features-ieeg-ieegdataset-parcellation]="parcellation"
    [sxplr-sapiviews-features-ieeg-ieegdataset-region]="region"
    [sxplr-sapiviews-features-ieeg-ieegdataset-feature]="feature"
    (sxplr-sapiviews-features-ieeg-ieegdataset-on-focus)="handleCtptClick($event)"
    (sxplr-sapiviews-features-ieeg-ieegdataset-on-defocus)="handleOnDeFocus($event)"
  >
  </sxplr-sapiviews-features-ieeg-ieegdataset>
  `,
  styles: [
    `
    :host
    {
      display: block;
      width: 20rem;
    }
    `
  ]
})
class EntryWrappercls {
  atlas: SapiAtlasModel
  template: SapiSpaceModel
  feature: SapiSpatialFeatureModel
  parcellation: SapiParcellationModel
  region: SapiRegionModel

  handleOnFocus(cpt: unknown){}
  handleOnDeFocus(cpt: unknown) {}
}

export default {
  component: EntryWrappercls,
  decorators: [
    moduleMetadata({
      imports: [
        SxplrSapiViewsFeaturesIeegModule,
      ],
      providers: [
        SAPI,
        ...provideDarkTheme,
      ],
      declarations: [
        EntryWrappercls
      ]
    })
  ],
} as Meta

const Template: Story<EntryWrappercls> = (args: EntryWrappercls, { loaded }) => {
  const { atlas, parc, space, region, feature } = loaded
  return ({
    props: {
      ...args,
      atlas: atlas,
      parcellation: parc,
      template: space,
      region: region,
      feature,
      handleOnFocus: action('handleOnFocus'),
      handleOnDeFocus: action('handleOnDeFocus')
    },
  })
}

const loadFeat = async () => {
  const atlas = await getHumanAtlas()
  const space = await getMni152()
  const parc = await getJba29()
  const region = await getHoc1Right()
  
  const features = await getMni152SpatialFeatureHoc1Right()
  const spatialFeats = features.filter(f => f["@type"] === "siibra/features/ieegSession")
  const feature = cleanIeegSessionDatasets(spatialFeats)[0]
  return {
    atlas,
    space,
    parc,
    region,
    feature
  }
}

export const Default = Template.bind({})
Default.args = {

}
Default.loaders = [
  async () => {
    const {
      atlas,
      space,
      feature,
      parc,
      region,
    } = await loadFeat()
    return {
      atlas, space, feature, parc, region  
    }
  }
]
