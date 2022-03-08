import { CommonModule } from "@angular/common"
import { Meta, moduleMetadata, Story } from "@storybook/angular"
import { SapiFeatureModel } from "src/atlasComponents/sapi"
import { getHoc1Features, getJba29Features, provideDarkTheme } from "src/atlasComponents/sapi/stories.base"
import { AngularMaterialModule } from "src/sharedModules"
import { SapiViewsFeaturesEntryListItem } from "./entryListItem.component"
import { Component, EventEmitter, Input, Output } from "@angular/core"
import { SapiViewsFeaturesModule } from ".."

@Component({
  selector: `feature-list-item-wrapper`,
  template: `
  <mat-card>
    <sxplr-sapiviews-features-entry-list-item
      *ngFor="let feat of features"
      (click)="clicked.emit(feat)"
      [sxplr-sapiviews-features-entry-list-item-feature]="feat"
      [sxplr-sapiviews-features-entry-list-item-ripple]="ripple">
    </sxplr-sapiviews-features-entry-list-item>
  </mat-card>
  `
})

class FeatureListItemWrapper {
  features: SapiFeatureModel[] = []

  @Input()
  ripple: boolean = true

  @Output()
  clicked = new EventEmitter()
}

export default {
  component: FeatureListItemWrapper,
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        AngularMaterialModule,
        SapiViewsFeaturesModule,
      ],
      declarations: [],
      providers: [
        ...provideDarkTheme,
      ],
    })
  ],

} as Meta

const Template: Story<SapiViewsFeaturesEntryListItem> = (args: SapiViewsFeaturesEntryListItem, { loaded }) => {
  const { features } = loaded
  return ({
    props: {
      ...args,
      features
    },
  })
}


export const RegionalFeatures = Template.bind({})
RegionalFeatures.args = {

}
RegionalFeatures.loaders = [
  async () => {
    const features = await getHoc1Features()
    return {
      features
    }
  }
]

export const ParcellationFeatures = Template.bind({})
ParcellationFeatures.loaders = [
  async () => {

    const features = await getJba29Features()
    return {
      features
    }
  }
]