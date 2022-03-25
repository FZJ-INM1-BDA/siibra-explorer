import { CommonModule } from "@angular/common"
import { HttpClientModule } from "@angular/common/http"
import { Component } from "@angular/core"
import { Meta, moduleMetadata, Story } from "@storybook/angular"
import { SAPI } from "src/atlasComponents/sapi"
import { getHoc1FeatureDetail, getHoc1Features, getHoc1Left, getHumanAtlas, getJba29, getMni152, provideDarkTheme } from "src/atlasComponents/sapi/stories.base"
import { AngularMaterialModule } from "src/sharedModules"
import { SapiAtlasModel, SapiFeatureModel, SapiParcellationModel, SapiRegionModel, SapiSpaceModel } from "../sapi/type"
import { SapiViewsCoreDatasetModule } from "./core/datasets"
import { SapiViewsFeaturesModule } from "./features"

@Component({
  selector: `rich-dataset-wrapper-cmp`,
  template: `
  <div *ngIf="!dataset">
    Dataset must be provided
  </div>
  <mat-card *ngIf="dataset">
    <sxplr-sapiviews-core-datasets-dataset
      [sxplr-sapiviews-core-datasets-dataset-input]="dataset">
    </sxplr-sapiviews-core-datasets-dataset>

    <sxplr-sapiviews-features-entry
      [sxplr-sapiviews-features-entry-atlas]="atlas"
      [sxplr-sapiviews-features-entry-space]="template"
      [sxplr-sapiviews-features-entry-parcellation]="parcellation"
      [sxplr-sapiviews-features-entry-region]="region"
      [sxplr-sapiviews-features-entry-feature]="dataset">
    </sxplr-sapiviews-features-entry>
  </mat-card>
  
  `,
  styles: [
    `mat-card { max-width: 40rem; }`
  ]
})

class RichDatasetWrapperCmp {
  atlas: SapiAtlasModel
  parcellation: SapiParcellationModel
  template: SapiSpaceModel
  region: SapiRegionModel
  dataset: SapiFeatureModel
}

export default {
  component: RichDatasetWrapperCmp,
  decorators: [
    moduleMetadata({
      imports: [
        AngularMaterialModule,
        CommonModule,
        HttpClientModule,
        SapiViewsCoreDatasetModule,
        SapiViewsFeaturesModule,
      ],
      providers: [
        SAPI,
        ...provideDarkTheme,
      ],
      declarations: []
    })
  ],
} as Meta

const Template: Story<RichDatasetWrapperCmp> = (args: RichDatasetWrapperCmp, { loaded }) => {
  const {
    
    atlas, 
    parcellation, 
    template, 
    region, 
    feature
  } = loaded
  return ({
    props: {
      atlas, 
      parcellation, 
      template, 
      region, 
      dataset: feature,
    },
  })
}

const loadRegionMetadata = async () => {

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

const loadFeat = async () => {
  const features = await getHoc1Features()
  return { features }
}

export const ReceptorDataset = Template.bind({})
ReceptorDataset.args = {

}
ReceptorDataset.loaders = [
  async () => {
    return await loadRegionMetadata()
  },
  async () => {
    const { features } = await loadFeat()
    const receptorfeat = features.find(f => f.type === "siibra/features/receptor")
    const feature = await getHoc1FeatureDetail(receptorfeat["@id"])
    return {
      feature
    }
  }
]