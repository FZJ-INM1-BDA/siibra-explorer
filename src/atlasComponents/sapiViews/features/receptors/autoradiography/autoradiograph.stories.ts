import { CommonModule } from "@angular/common"
import { HttpClientModule } from "@angular/common/http"
import { Component, ViewChild } from "@angular/core"
import { FormsModule } from "@angular/forms"
import { BrowserAnimationsModule } from "@angular/platform-browser/animations"
import { Meta, moduleMetadata, Story } from "@storybook/angular"
import { SAPI, SapiAtlasModel, SapiParcellationModel, SapiRegionModel, SapiSpaceModel } from "src/atlasComponents/sapi"
import { getHoc1Features, getHoc1Left, getHumanAtlas, getJba29, getMni152, HumanHoc1StoryBase } from "src/atlasComponents/sapi/stories.base"
import { AngularMaterialModule } from "src/sharedModules"
import { Autoradiography } from "./autoradiography.component"

@Component({
  selector: 'autoradiograph-wrapper-cmp',
  template: `
  <mat-form-field appearance="fill">
    <mat-select [(ngModel)]="selectedSymbol">
      <mat-option value="" disabled>
        --select--
      </mat-option>

      <mat-option [value]="option"
        *ngFor="let option of options">
        {{ option }}
      </mat-option>
    </mat-select>
  </mat-form-field>
  <sxplr-sapiviews-features-receptor-autoradiograph
    class="d-inline-block w-100 h-100"
    [sxplr-sapiviews-features-receptor-atlas]="atlas"
    [sxplr-sapiviews-features-receptor-parcellation]="parcellation"
    [sxplr-sapiviews-features-receptor-template]="template"
    [sxplr-sapiviews-features-receptor-region]="region"
    [sxplr-sapiviews-features-receptor-featureid]="featureId"
    [sxplr-sapiviews-features-receptor-autoradiograph-selected-symbol]="selectedSymbol"
  >
  </sxplr-sapiviews-features-receptor-autoradiograph>
  `,
  styles: [
    `
    :host
    {
      display: block;
      max-width: 24rem;
      max-height: 24rem;
    }
    `
  ]
})
class AutoRadiographWrapperCls {
  atlas: SapiAtlasModel
  parcellation: SapiParcellationModel
  template: SapiSpaceModel
  region: SapiRegionModel
  featureId: string

  @ViewChild(Autoradiography)
  ar: Autoradiography

  selectedSymbol: string

  get options(){
    return Object.keys(this.ar?.receptorData?.data?.autoradiographs || {})
  }
}

export default {
  component: AutoRadiographWrapperCls,
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        AngularMaterialModule,
        HttpClientModule,
        BrowserAnimationsModule,
        FormsModule,
      ],
      providers: [
        SAPI
      ],
      declarations: [
        Autoradiography
      ]
    })
  ],
} as Meta

const Template: Story<AutoRadiographWrapperCls> = (args: AutoRadiographWrapperCls, { loaded }) => {
  const { atlas, parc, space, region, receptorfeat } = loaded
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