import { CommonModule } from "@angular/common"
import { HttpClientModule } from "@angular/common/http"
import { Component, OnDestroy } from "@angular/core"
import { Meta, moduleMetadata, Story } from "@storybook/angular"
import { forkJoin, Observable, Observer, Subscription } from "rxjs"
import { map, switchMap } from "rxjs/operators"
import { SAPI, SapiAtlasModel, SapiParcellationModel, SapiRegionModel, SapiSpaceModel } from "src/atlasComponents/sapi"
import { getHoc1Features, getHoc1Left, getHumanAtlas, getJba29, getMni152, HumanHoc1StoryBase } from "src/atlasComponents/sapi/stories.base"
import { AngularMaterialModule } from "src/sharedModules"
import { BaseReceptor } from "../base"
import { Fingerprint } from "./fingerprint.component"

@Component({
  selector: 'fingerprint-wrapper-cmp',
  template: `
  <sxplr-sapiviews-features-receptor-fingerprint
    [sxplor-sapiviews-features-receptor-atlas]="atlas"
    [sxplor-sapiviews-features-receptor-parcellation]="parcellation"
    [sxplor-sapiviews-features-receptor-template]="template"
    [sxplor-sapiviews-features-receptor-region]="region"
    [sxplor-sapiviews-features-receptor-featureid]="featureId"
  >
  </sxplr-sapiviews-features-receptor-fingerprint>
  `
})
class FingerprintWrapperCls {
  atlas: SapiAtlasModel
  parcellation: SapiParcellationModel
  template: SapiSpaceModel
  region: SapiRegionModel
  featureId: string

}

export default {
  component: FingerprintWrapperCls,
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        AngularMaterialModule,
        HttpClientModule,
      ],
      providers: [
        SAPI
      ],
      declarations: [
        Fingerprint
      ]
    })
  ],
} as Meta

const Template: Story<FingerprintWrapperCls> = (args: FingerprintWrapperCls, { loaded }) => {
  const { atlas, parc, space, region, receptorfeat } = loaded
  console.log({ atlas, parc, space, region, receptorfeat })
  return ({
    props: {
      ...args,
      atlas: atlas,
      parcellation: parc,
      template: space,
      region: region,
      featureId: receptorfeat["@id"]
    },
  })
}

Template.loaders = [
  async () => {
    const atlas = await getHumanAtlas()
    const parc = await getJba29()
    const region = await getHoc1Left()
    const space = await getMni152()
    const features = await getHoc1Features()
    const receptorfeat = features.find(f => f.type === "siibra/receptor")
    return {
      atlas, parc, space, region, receptorfeat
    }
  }
]

export const Default = Template.bind({})
Default.args = {

}
Default.loaders = [
  ...Template.loaders
]