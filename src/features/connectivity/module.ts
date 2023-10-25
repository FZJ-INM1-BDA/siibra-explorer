import { CommonModule } from "@angular/common";
import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from "@angular/core";
import { SAPI } from "src/atlasComponents/sapi";
import { ConnectivityBrowserComponent } from "./connectivityBrowser/connectivityBrowser.component";
import { ReactiveFormsModule } from "@angular/forms";
import { DialogModule } from "src/ui/dialogInfo";
import { UtilModule } from "src/util";
import { AngularMaterialModule } from "src/sharedModules";


@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AngularMaterialModule,
    DialogModule,
    UtilModule,
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
