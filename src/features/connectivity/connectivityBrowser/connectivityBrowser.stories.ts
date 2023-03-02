import { CommonModule } from "@angular/common"
import { HttpClientModule } from "@angular/common/http"
import {ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA} from "@angular/core"
import { FormsModule } from "@angular/forms"
import { BrowserAnimationsModule } from "@angular/platform-browser/animations"
import { Meta, moduleMetadata, Story } from "@storybook/angular"
import { SAPI, SapiAtlasModel, SapiParcellationModel } from "src/atlasComponents/sapi"
import { getJba29Features, getHumanAtlas, getJba29 } from "src/atlasComponents/sapi/stories.base"
import {SapiParcellationFeatureMatrixModel, SapiParcellationFeatureModel} from "src/atlasComponents/sapi/type"
import { AngularMaterialModule } from "src/sharedModules"
import {PARSE_TYPEDARRAY} from "src/atlasComponents/sapi/sapi.service";
import {catchError, take} from "rxjs/operators"
import {of} from "rxjs";
import { ConnectivityBrowserComponent } from "./connectivityBrowser.component"

@Component({
  selector: 'autoradiograph-wrapper-cmp',
  template: `
    
  <button mat-button (click)="datasetSliderChanged(1)" class="mb-3">Load Connectivity</button>

  <div class="d-flex">Source: {{regionName}}</div>

    <mat-label>
        Dataset
    </mat-label>
    <mat-slider [min]="1"
            [max]="numberOfDatasets"
            (change)="datasetSliderChanged($event.value)"
            [value]="pageNumber"
            thumbLabel
            step="1"
            class="w-100">
    </mat-slider>

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
  type: string = 'siibra/features/connectivity/streamlineCounts'
  pageNumber = 1
  numberOfDatasets = 1
  private regionIndexInMatrix = -1
  public connectionsString: string


  constructor(private sapi: SAPI, private cdf: ChangeDetectorRef) {
  }

  datasetSliderChanged(pageNumber) {
    this.pageNumber = pageNumber
    this.loadDataset()
  }

  loadDataset() {
    return this.sapi.getParcellation(this.atlas["@id"], this.parcellation["@id"])
        .getFeatures({type: this.type, page: this.pageNumber, size: 1})
        .pipe(
            take(1),
            catchError(() => {
              return of(null)
            })
        ).subscribe((res: any) => {
          if (res && res.items) {
            this.numberOfDatasets = res.total
            this.featureId = res.items[0]['@id']
            this.fetchConnectivity()
          }
        })
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
            this.cdf.detectChanges()
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
