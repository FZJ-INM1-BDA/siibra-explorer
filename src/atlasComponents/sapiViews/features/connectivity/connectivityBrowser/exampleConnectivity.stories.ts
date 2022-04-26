import { CommonModule } from "@angular/common"
import { HttpClientModule } from "@angular/common/http"
import {Component, CUSTOM_ELEMENTS_SCHEMA} from "@angular/core"
import { FormsModule } from "@angular/forms"
import { BrowserAnimationsModule } from "@angular/platform-browser/animations"
import { Meta, moduleMetadata, Story } from "@storybook/angular"
import { SAPI, SapiAtlasModel, SapiParcellationModel } from "src/atlasComponents/sapi"
import { getJba29Features, getHumanAtlas, getJba29 } from "src/atlasComponents/sapi/stories.base"
import {SapiParcellationFeatureMatrixModel, SapiParcellationFeatureModel} from "src/atlasComponents/sapi/type"
import { AngularMaterialModule } from "src/sharedModules"
import {ConnectivityBrowserComponent} from "src/atlasComponents/sapiViews/features/connectivity";
import {PARSE_TYPEDARRAY} from "src/atlasComponents/sapi/sapi.service";
import { take } from "rxjs/operators"

@Component({
  selector: 'autoradiograph-wrapper-cmp',
  template: `
  <mat-form-field appearance="fill">
    <mat-select [(ngModel)]="featureId" (selectionChange)="fetchConnectivity()">
      <mat-option value="null" disabled>
        --select--
      </mat-option>

      <mat-option [value]="feat['@id']"
        *ngFor="let feat of features">
        {{ feat.name }}
      </mat-option>
    </mat-select>
  </mat-form-field>
  
  <div class="d-flex">Source: {{regionName}}</div>

  <hbp-connectivity-matrix-row
      #connectivityComponent
      [region]="regionName"
      [connections]="connectionsString"
      showSource="true"
      theme="light">
  </hbp-connectivity-matrix-row>
      
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
class ExampleConnectivityBrowserWrapper {
  atlas: SapiAtlasModel
  parcellation: SapiParcellationModel
  features: SapiParcellationFeatureModel[] = []
  featureId: string

  regionName: string = 'Area TE 3 (STG) right'
  private regionIndexInMatrix = -1
  public connectionsString: string


  constructor(private sapi: SAPI) {
  }

  fetchConnectivity() {
    this.sapi.getParcellation(this.atlas["@id"], this.parcellation["@id"]).getFeatureInstance(this.featureId)
      .pipe(take(1))
      .subscribe(ds=> {
        const matrixData = ds as SapiParcellationFeatureMatrixModel
        this.regionIndexInMatrix =  (matrixData.columns as Array<string>).findIndex(md => md === this.regionName)
        this.sapi.processNpArrayData<PARSE_TYPEDARRAY.RAW_ARRAY>(matrixData.matrix, PARSE_TYPEDARRAY.RAW_ARRAY)
          .then(matrix => {
            const areas = {}
            matrix.rawArray[this.regionIndexInMatrix].forEach((value, i) => {
              areas[matrixData.columns[i]] = value
            })
            this.connectionsString = JSON.stringify(areas)
          })
      })
  }


}

export default {
  component: ExampleConnectivityBrowserWrapper,
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
      schemas: [
        CUSTOM_ELEMENTS_SCHEMA,
      ],
      declarations: [
        ConnectivityBrowserComponent
      ]
    })
  ],
} as Meta

const Template: Story<ExampleConnectivityBrowserWrapper> = (args: ExampleConnectivityBrowserWrapper, { loaded }) => {
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
