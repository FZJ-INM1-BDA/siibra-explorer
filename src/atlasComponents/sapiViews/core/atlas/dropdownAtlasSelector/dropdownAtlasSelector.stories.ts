import { CommonModule } from "@angular/common"
import { HttpClientModule } from "@angular/common/http"
import { Meta, moduleMetadata, Story } from "@storybook/angular"
import { SAPI } from "src/atlasComponents/sapi"
import { provideDarkTheme } from "src/atlasComponents/sapi/stories.base"
import { SapiViewsCoreAtlasAtlasDropdownSelector } from "./dropdownAtlasSelector.component"
import { SapiViewsCoreAtlasModule } from "../module"
import { atlasSelection } from "src/state"
import { StoreModule } from "@ngrx/store"

export default {
  component: SapiViewsCoreAtlasAtlasDropdownSelector,
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        HttpClientModule,
        SapiViewsCoreAtlasModule,

        StoreModule.forRoot({
          [atlasSelection.nameSpace]: atlasSelection.reducer
        }),
      ],
      providers: [
        SAPI,
        ...provideDarkTheme,
      ],
      declarations: []
    })
  ],
} as Meta

const Template: Story<SapiViewsCoreAtlasAtlasDropdownSelector> = (args: SapiViewsCoreAtlasAtlasDropdownSelector, { parameters }) => {
  /**
   * TODO can't seem to hook in handlechangeAtlas action
   * always results in maximum call stack reached
   * perhaps related: https://github.com/storybookjs/storybook/issues/13238
   */
  return ({
    props: {
    },
  })
}


export const Default = Template.bind({})
Default.args = {

}