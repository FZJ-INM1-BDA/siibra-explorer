// import { CommonModule } from "@angular/common"
// import { HttpClientModule } from "@angular/common/http"
// import {Component, CUSTOM_ELEMENTS_SCHEMA} from "@angular/core"
// import { FormsModule } from "@angular/forms"
// import { BrowserAnimationsModule } from "@angular/platform-browser/animations"
// import { Meta, moduleMetadata, Story } from "@storybook/angular"
// import { SAPI, SapiAtlasModel, SapiParcellationModel } from "src/atlasComponents/sapi"
// import { getJba29Features, getHumanAtlas, getJba29 } from "src/atlasComponents/sapi/stories.base"
// import {SapiParcellationFeatureModel} from "src/atlasComponents/sapi/type"
// import { AngularMaterialModule } from "src/sharedModules"
// import {ConnectivityBrowserComponent} from "src/atlasComponents/sapiViews/features/connectivity";
//
// @Component({
//   selector: 'connectivity-wrapper-cmp',
//   template: `
// <!--    <hbp-connectivity-matrix-row-->
// <!--        #connectivityComponent-->
// <!--        *ngIf="regionName"-->
// <!--        [region]="regionName"-->
// <!--        [connections]="connectionsString"-->
// <!--        theme="dark"-->
// <!--        show-export="true"-->
// <!--        show-source="true"-->
// <!--        show-title="false"-->
// <!--        show-toolbar="false"-->
// <!--        show-description="false"-->
// <!--        show-dataset-name="false"-->
// <!--        custom-dataset-selector="true"-->
// <!--        tools_showlog="true"-->
// <!--        hide-export-view="true">-->
//
// <!--      <div slot="dataset">-->
// <!--        <div *ngIf="features.length && featureId"  class=" flex-grow-0 flex-shrink-0 d-flex flex-row flex-nowrap">-->
// <!--          <mat-form-field class="flex-grow-1 flex-shrink-1 w-0">-->
// <!--            <mat-label>-->
// <!--              Dataset-->
// <!--            </mat-label>-->
//
// <!--            <mat-select-->
// <!--                [(ngModel)]="featureId"-->
// <!--                (selectionChange)="fetchConnectivity()">-->
// <!--              <mat-option-->
// <!--                  [matTooltip]="dataset.dataset.name"-->
// <!--                  *ngFor="let dataset of features"-->
// <!--                  [value]="dataset['@id']">-->
// <!--                {{ dataset.dataset.name }}-->
// <!--              </mat-option>-->
// <!--            </mat-select>-->
// <!--          </mat-form-field>-->
// <!--        </div>-->
// <!--      </div>-->
//
// <!--    </hbp-connectivity-matrix-row>-->
//
// <div *ngIf="features.length && featureId"  class=" flex-grow-0 flex-shrink-0 d-flex flex-row flex-nowrap">
// <!--  <mat-form-field class="flex-grow-1 flex-shrink-1 w-0">-->
// <!--    <mat-label>-->
// <!--      Dataset-->
// <!--    </mat-label>-->
//
// <!--    <mat-select-->
// <!--        [(ngModel)]="featureId">-->
// <!--      <mat-option-->
// <!--          [matTooltip]="dataset.dataset.name"-->
// <!--          *ngFor="let dataset of features"-->
// <!--          [value]="dataset['@id']">-->
// <!--        {{ dataset.dataset.name }}-->
// <!--      </mat-option>-->
// <!--    </mat-select>-->
// <!--  </mat-form-field>-->
//
//   <mat-form-field appearance="fill">
//     <mat-select [(ngModel)]="featureId">
//       <mat-option value="null" disabled>
//         --select--
//       </mat-option>
//
//       <mat-option [value]="feat['@id']"
//                   *ngFor="let feat of features">
//         {{ feat.name }}
//       </mat-option>
//     </mat-select>
//   </mat-form-field>
//
//
// </div>
//   `,
//   styles: [
//     `
//     :host
//     {
//       display: block;
//       max-width: 60rem;
//       max-height: 60rem;
//     }
//     `
//   ]
// })
// class ExampleConnectivityBrowserWrapper {
//   atlas: SapiAtlasModel
//   parcellation: SapiParcellationModel
//   features: SapiParcellationFeatureModel[] = []
//   featureId: string
//   regionName: string = 'Area TE 3 (STG) right'
//
//   public connectionsString: string
//
//   private regionIndexInMatrix = -1
//
//   public fetching: boolean = false
//   public matrixString: string
//
//   // constructor( private sapi: SAPI) {
//   // }
//   //
//   //
//   // fetchConnectivity() {
//   //   this.fetching = true
//   //   this.sapi.getParcellation(this.atlas["@id"], this.parcellation["@id"]).getFeatureInstance(this.featureId)
//   //     .then(ds=> {
//   //       const matrixData = ds as SapiParcellationFeatureMatrixModel
//   //       this.regionIndexInMatrix =  (matrixData.columns as Array<string>).findIndex(md => md === this.regionName)
//   //       this.sapi.processNpArrayData<PARSE_TYPEDARRAY.RAW_ARRAY>(matrixData.matrix, PARSE_TYPEDARRAY.RAW_ARRAY)
//   //         .then(matrix => {
//   //           const areas = {}
//   //           matrix.rawArray[this.regionIndexInMatrix].forEach((value, i) => {
//   //             areas[matrixData.columns[i]] = value
//   //           })
//   //           this.connectionsString = JSON.stringify(areas)
//   //
//   //           this.matrixString = JSON.stringify(matrixData.columns.map((mc, i) => ([mc, ...matrix.rawArray[i]])))
//   //           console.log(this.matrixString)
//   //         })
//   //       this.fetching = false
//   //     }).catch(() => this.fetching = false)
//   // }
// }
//
// export default {
//   component: ExampleConnectivityBrowserWrapper,
//   decorators: [
//     moduleMetadata({
//       imports: [
//         CommonModule,
//         AngularMaterialModule,
//         HttpClientModule,
//         BrowserAnimationsModule,
//         FormsModule,
//       ],
//       providers: [
//         SAPI
//       ],
//       schemas: [
//         CUSTOM_ELEMENTS_SCHEMA,
//       ],
//       declarations: [
//         ConnectivityBrowserComponent
//       ]
//     })
//   ],
// } as Meta
//
// const Template: Story<ExampleConnectivityBrowserWrapper> = (args: ExampleConnectivityBrowserWrapper, { loaded }) => {
//   const { atlas, parc, features } = loaded
//   return ({
//     props: {
//       ...args,
//       atlas: atlas,
//       parcellation: parc,
//       features
//     },
//   })
// }
//
// Template.loaders = [
//   async () => {
//     const atlas = await getHumanAtlas()
//     const parc = await getJba29()
//     const features = await getJba29Features()
//     return {
//       atlas, parc, features
//     }
//   }
// ]
//
// export const Default = Template.bind({})
// Default.args = {
//
// }
// Default.loaders = [
//   ...Template.loaders
// ]
