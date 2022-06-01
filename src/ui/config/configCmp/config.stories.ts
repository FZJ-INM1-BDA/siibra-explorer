import { CommonModule } from "@angular/common"
import { HttpClientModule } from "@angular/common/http"
import { Meta, moduleMetadata, Story } from "@storybook/angular"
import { provideDarkTheme } from "src/atlasComponents/sapi/stories.base"
import { ConfigModule } from "../module"
import { ConfigComponent } from "./config.component"
import { userPreference, userInterface, atlasSelection } from "src/state"
import { StoreModule } from "@ngrx/store"

export default {
  component: ConfigComponent,
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        HttpClientModule,
        ConfigModule,
        StoreModule.forRoot({
          [userPreference.nameSpace]: userPreference.reducer,
          [userInterface.nameSpace]: userInterface.reducer,
          [atlasSelection.nameSpace]: atlasSelection.reducer,
        })
      ],
      providers: [
        ...provideDarkTheme,
      ],
      declarations: []
    })
  ],
} as Meta

const Template: Story<ConfigComponent> = (args: ConfigComponent, { loaded }) => {
  const { experimentalFlag } = args
  return ({
    props: {
      experimentalFlag
    },
  })
}

export const Default = Template.bind({})
Default.args = {
  experimentalFlag: true
}
Default.loaders = [
]