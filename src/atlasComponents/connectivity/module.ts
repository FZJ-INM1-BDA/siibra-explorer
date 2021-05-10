import { CommonModule } from "@angular/common";
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module";
import { DatabrowserModule } from "../databrowserModule";
import { ConnectivityBrowserComponent } from "./connectivityBrowser/connectivityBrowser.component";
import {HasConnectivity} from "src/atlasComponents/connectivity/hasConnectivity.directive";

@NgModule({
  imports: [
    CommonModule,
    DatabrowserModule,
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
