import { CommonModule } from "@angular/common";
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { AngularMaterialModule } from "src/sharedModules";
import { ConnectivityBrowserComponent } from "./connectivityBrowser/connectivityBrowser.component";
import {HasConnectivity} from "src/atlasComponents/connectivity/hasConnectivity.directive";
import {KgDatasetModule} from "src/atlasComponents/regionalFeatures/bsFeatures/kgDataset";
import {FormsModule} from "@angular/forms";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    KgDatasetModule,
    AngularMaterialModule
  ],
  declarations: [
    ConnectivityBrowserComponent,
    HasConnectivity
  ],
  exports: [
    ConnectivityBrowserComponent,
    HasConnectivity
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA,
  ],
})

export class AtlasCmptConnModule{}
