import { CommonModule } from "@angular/common";
import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from "@angular/core";
import { SAPI } from "src/atlasComponents/sapi";
import {ConnectivityBrowserComponent} from "src/atlasComponents/sapiViews/features/connectivity/connectivityBrowser/connectivityBrowser.component";
import {HasConnectivity} from "src/atlasComponents/sapiViews/features/connectivity/hasConnectivity.directive";
import {AngularMaterialModule} from "src/sharedModules";
import {FormsModule} from "@angular/forms";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
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
  providers: [
    SAPI,
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA,
  ],
})

export class SapiViewsFeatureConnectivityModule{}
