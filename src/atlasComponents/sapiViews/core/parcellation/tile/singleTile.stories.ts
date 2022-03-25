import { CommonModule } from "@angular/common"
import { HttpClientModule } from "@angular/common/http"
import { provideMockStore } from "@ngrx/store/testing"
import { Meta, moduleMetadata, Story } from "@storybook/angular"
import { SAPI, SapiParcellationModel } from "src/atlasComponents/sapi"
import { parcId, provideDarkTheme, getParc, getHumanAtlas } from "src/atlasComponents/sapi/stories.base"
import { AngularMaterialModule } from "src/sharedModules"
import { FilterGroupedParcellationPipe } from "../filterGroupedParcellations.pipe"
import { GroupedParcellation } from "../groupedParcellation"
import { SapiViewsCoreParcellationModule } from "../module"
import { SapiViewsCoreParcellationParcellationTile } from "./parcellation.tile.component"

export default {
  component: SapiViewsCoreParcellationParcellationTile,
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        HttpClientModule,
        SapiViewsCoreParcellationModule,
        AngularMaterialModule,
      ],
      providers: [
        provideMockStore(),
        SAPI,
        ...provideDarkTheme,
      ],
      declarations: [
        
      ],
    }),
  ],
} as Meta

const Template: Story<SapiViewsCoreParcellationParcellationTile> = (args: SapiViewsCoreParcellationParcellationTile, { loaded }) => {
  const { 
    groups
  } = loaded
  
  const {
    gutterSize,
    rowHeight
  } = args
  return ({
    props: {
      gutterSize,
      rowHeight,
      parcellation: groups[1]
    },
    styles: [
      `sxplr-sapiviews-core-parcellation-tile { display: inline-block; max-width: 8rem; }`
    ]
  })
}
Template.loaders = [

]

const asyncLoader = async () => {
  const parcs: SapiParcellationModel[] = []

  const atlasDetail = await getHumanAtlas()
  
  for (const parc of atlasDetail.parcellations) {
    const parcDetail = await getParc(atlasDetail['@id'], parc['@id'])
    parcs.push(parcDetail)
  }

  const pipe = new FilterGroupedParcellationPipe()
  const groups = pipe.transform(parcs, true) as GroupedParcellation[]
  return {
    groups
  }
}

export const Default = Template.bind({})
Default.args = {
  selected: parcId.human.longBundle
}
Default.loaders = [

  async () => {
    const {
      groups
    } = await asyncLoader()
    return {
      groups
    }
  }
]
