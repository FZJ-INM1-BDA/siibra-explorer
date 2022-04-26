import { CommonModule } from "@angular/common";
import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from "@angular/core";
import { SAPI } from "src/atlasComponents/sapi";
import { ConnectivityMatrixView } from "./connectivityMatrix/connectivityMatrix.component";
import {ConnectivityBrowserComponent} from "src/atlasComponents/sapiViews/features/connectivity/connectivityBrowser/connectivityBrowser.component";
import {HasConnectivity} from "src/atlasComponents/sapiViews/features/connectivity/hasConnectivity.directive";
import {AngularMaterialModule} from "src/sharedModules";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule
  ],
  declarations: [
    ConnectivityMatrixView,
    ConnectivityBrowserComponent,
    HasConnectivity
  ],
  exports: [
    ConnectivityMatrixView,
    ConnectivityBrowserComponent,
    HasConnectivity
  ],
  providers: [
    SAPI,
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA,
  ],
})

export class SapiViewsFeatureConnectivityModule{}
