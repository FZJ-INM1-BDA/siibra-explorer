import { CommonModule } from "@angular/common";
import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from "@angular/core";
import { SAPI } from "src/atlasComponents/sapi";

import {AngularMaterialModule} from "src/sharedModules";
import {FormsModule} from "@angular/forms";
import { DialogModule } from "src/ui/dialogInfo";

import { ConnectivityBrowserComponent } from "./connectivityBrowser/connectivityBrowser.component";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    AngularMaterialModule,
    DialogModule
  ],
  declarations: [
    ConnectivityBrowserComponent,
  ],
  exports: [
    ConnectivityBrowserComponent,
  ],
  providers: [
    SAPI,
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA,
  ],
})

export class SapiViewsFeatureConnectivityModule{}
