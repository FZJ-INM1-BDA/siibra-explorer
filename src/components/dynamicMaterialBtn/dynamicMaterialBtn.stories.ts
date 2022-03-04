import { CommonModule } from "@angular/common"
import { Meta, moduleMetadata, Story } from "@storybook/angular"
import { AngularMaterialModule } from "src/sharedModules"
import {
  DynamicMaterialBtn
} from "./dynamicMaterialBtn.component"

export default {
  component: DynamicMaterialBtn,
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        AngularMaterialModule,
      ],
    })
  ],
} as Meta

const Template: Story<DynamicMaterialBtn> = (args: DynamicMaterialBtn) => ({
  template: `<iav-dynamic-mat-button>Dynamic Button</iav-dynamic-mat-button>`,
  props: args
})

export const Default = Template.bind({})
Default.args = {
  matBtnDisabled: false
}

export const RaiseButton = Template.bind({})
RaiseButton.args = {
  ...Default.args,
  matBtnStyle: "mat-raised-button"
}

export const RaisePrimaryButton = Template.bind({})
RaisePrimaryButton.args = {
  ...Default.args,
  matBtnStyle: "mat-raised-button",
  matBtnColor: "primary",
}


export const RaisePrimaryDisabledButton = Template.bind({})
RaisePrimaryDisabledButton.args = {
  ...Default.args,
  matBtnStyle: "mat-raised-button",
  matBtnColor: "primary",
  matBtnDisabled: true,
}
