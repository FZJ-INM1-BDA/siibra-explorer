import { CommonModule, DOCUMENT } from "@angular/common"
import { HttpClientModule } from "@angular/common/http"
import { Meta, moduleMetadata, Story } from "@storybook/angular"
import { SAPI, SapiAtlasModel, SapiParcellationModel, SapiRegionModel, SapiSpaceModel } from "src/atlasComponents/sapi"
import { getHoc1RightFeatureDetail, getHoc1RightFeatures, getHoc1Right, getHumanAtlas, getJba29, getMni152, provideDarkTheme } from "src/atlasComponents/sapi/stories.base"
import { AngularMaterialModule } from "src/sharedModules"
import { Entry } from "./entry.component"
import { ReceptorViewModule } from ".."
import { appendScriptFactory, APPEND_SCRIPT_TOKEN } from "src/util/constants"
import { Component, Output } from "@angular/core"
import { SapiRegionalFeatureReceptorModel } from "src/atlasComponents/sapi/type"

@Component({
  selector: 'entry-wrapper-cmp',
  template: `
  <sxplr-sapiviews-features-receptor-entry
    [sxplr-sapiviews-features-receptor-atlas]="atlas"
    [sxplr-sapiviews-features-receptor-parcellation]="parcellation"
    [sxplr-sapiviews-features-receptor-template]="template"
    [sxplr-sapiviews-features-receptor-region]="region"
    [sxplr-sapiviews-features-receptor-featureid]="featureId"
    [sxplr-sapiviews-features-receptor-data]="feature"
  >
  </sxplr-sapiviews-features-receptor-entry>
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
  parcellation: SapiParcellationModel
  template: SapiSpaceModel
  region: SapiRegionModel
  feature: SapiRegionalFeatureReceptorModel
  featureId: string

}

export default {
  component: EntryWrappercls,
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        HttpClientModule,
        ReceptorViewModule,
        AngularMaterialModule,
      ],
      providers: [
        SAPI,
        {
          provide: APPEND_SCRIPT_TOKEN,
          useFactory: appendScriptFactory,
          deps: [ DOCUMENT ]
        },
        ...provideDarkTheme,
      ],
      declarations: [
        EntryWrappercls
      ]
    })
  ],
} as Meta

const Template: Story<Entry> = (args: Entry, { loaded }) => {
  const { atlas, parc, space, region, featureId, feature } = loaded
  return ({
    props: {
      ...args,
      atlas: atlas,
      parcellation: parc,
      template: space,
      region: region,
      feature,
      featureId,
    },
  })
}

const loadFeat = async () => {
  const atlas = await getHumanAtlas()
  const parc = await getJba29()
  const region = await getHoc1Right()
  const space = await getMni152()
  const features = await getHoc1RightFeatures()
  const receptorfeat = features.find(f => f['@type'] === "siibra/features/receptor")
  const feature = await getHoc1RightFeatureDetail(receptorfeat["@id"])
  return {
    atlas,
    parc,
    space,
    region,
    featureId: receptorfeat["@id"],
    feature
  }
}

export const Default = Template.bind({})
Default.args = {

}
Default.loaders = [
  async () => {
    const { atlas, parc, space, region, featureId } = await loadFeat()
    return {
      atlas, parc, space, region, featureId
    }
  }
]

export const LoadViaDirectlyInjectData = Template.bind({})
LoadViaDirectlyInjectData.loaders = [
  async () => {

    const { feature } = await loadFeat()
    return {
      feature
    }
  }
]