import { CommonModule } from "@angular/common";
import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from "@angular/core";
import { SAPI } from "src/atlasComponents/sapi";
import { ConnectivityBrowserComponent } from "./connectivityBrowser/connectivityBrowser.component";
import { ReactiveFormsModule } from "@angular/forms";
import { DialogModule } from "src/ui/dialogInfo";
import { MatSelectModule } from "@angular/material/select";
import { MatRadioModule } from "@angular/material/radio";
import { MatSliderModule } from "@angular/material/slider";
import { MatMenuModule } from "@angular/material/menu";
import { UtilModule } from "src/util";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatButtonModule } from "@angular/material/button";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatRadioModule,
    MatSliderModule,
    MatMenuModule,
    DialogModule,
    UtilModule,
    MatCheckboxModule,
    MatButtonModule,
    MatProgressSpinnerModule,
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
