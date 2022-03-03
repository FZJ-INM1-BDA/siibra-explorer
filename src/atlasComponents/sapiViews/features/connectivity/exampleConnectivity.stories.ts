import { CommonModule } from "@angular/common"
import { HttpClientModule } from "@angular/common/http"
import { Component } from "@angular/core"
import { FormsModule } from "@angular/forms"
import { BrowserAnimationsModule } from "@angular/platform-browser/animations"
import { Meta, moduleMetadata, Story } from "@storybook/angular"
import { SAPI, SapiAtlasModel, SapiParcellationModel } from "src/atlasComponents/sapi"
import { getJba29Features, getHumanAtlas, getJba29 } from "src/atlasComponents/sapi/stories.base"
import { SapiParcellationFeatureModel } from "src/atlasComponents/sapi/type"
import { AngularMaterialModule } from "src/sharedModules"
import { ConnectivityMatrixView } from "./connectivityMatrix/connectivityMatrix.component"

@Component({
  selector: 'autoradiograph-wrapper-cmp',
  template: `
  <mat-form-field appearance="fill">
    <mat-select [(ngModel)]="featureId">
      <mat-option value="null" disabled>
        --select--
      </mat-option>

      <mat-option [value]="feat['@id']"
        *ngFor="let feat of features">
        {{ feat.name }}
      </mat-option>
    </mat-select>
  </mat-form-field>
  <sxplr-sapiviews-features-connectivity-matrix
    class="d-inline-block w-100 h-100"
    *ngIf="featureId"
    [sxplr-sapiviews-features-connectivity-matrix-atlas]="atlas"
    [sxplr-sapiviews-features-connectivity-matrix-parcellation]="parcellation"
    [sxplr-sapiviews-features-connectivity-matrix-featureid]="featureId"
  >
  </sxplr-sapiviews-features-connectivity-matrix>
  `,
  styles: [
    `
    :host
    {
      display: block;
      max-width: 60rem;
      max-height: 60rem;
    }
    `
  ]
})
class ExampleConnectivityMatrixWrapper {
  atlas: SapiAtlasModel
  parcellation: SapiParcellationModel
  features: SapiParcellationFeatureModel[] = []
  featureId: string
}

export default {
  component: ExampleConnectivityMatrixWrapper,
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
        ConnectivityMatrixView
      ]
    })
  ],
} as Meta

const Template: Story<ExampleConnectivityMatrixWrapper> = (args: ExampleConnectivityMatrixWrapper, { loaded }) => {
  const { atlas, parc, features } = loaded
  return ({
    props: {
      ...args,
      atlas: atlas,
      parcellation: parc,
      features
    },
  })
}

Template.loaders = [
  async () => {
    const atlas = await getHumanAtlas()
    const parc = await getJba29()
    const features = await getJba29Features()
    return {
      atlas, parc, features
    }
  }
]

export const Default = Template.bind({})
Default.args = {

}
Default.loaders = [
  ...Template.loaders
]