import { CommonModule } from "@angular/common"
import { HttpClientModule } from "@angular/common/http"
import { Meta, moduleMetadata, Story } from "@storybook/angular"
import { SAPI } from "src/atlasComponents/sapi"
import { getHoc1RightFeatureDetail, getHoc1RightFeatures, provideDarkTheme } from "src/atlasComponents/sapi/stories.base"
import { SapiViewsCoreDatasetModule } from ".."
import { DatasetView } from "./dataset.component"

export default {
  component: DatasetView,
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        HttpClientModule,
        SapiViewsCoreDatasetModule,
      ],
      providers: [
        SAPI,
        ...provideDarkTheme,
      ],
      declarations: []
    })
  ],
} as Meta

const Template: Story<DatasetView> = (args: DatasetView, { loaded }) => {
  const { feature } = loaded
  return ({
    props: {
      ...args,
      dataset: feature,
    },
  })
}

const loadFeat = async () => {
  const features = await getHoc1RightFeatures()
  const receptorfeat = features.find(f => f['@type'] === "siibra/features/receptor")
  const feature = await getHoc1RightFeatureDetail(receptorfeat["@id"])
  return {
    feature
  }
}

export const ReceptorDataset = Template.bind({})
ReceptorDataset.args = {

}
ReceptorDataset.loaders = [
  async () => {
    const { feature } = await loadFeat()
    return {
      feature
    }
  }
]