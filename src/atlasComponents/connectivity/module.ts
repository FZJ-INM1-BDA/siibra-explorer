import { CommonModule } from "@angular/common";
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module";
import { DatabrowserModule } from "../databrowserModule";
import { ConnectivityBrowserComponent } from "./connectivityBrowser/connectivityBrowser.component";

@NgModule({
  imports: [
    CommonModule,
    DatabrowserModule,
    AngularMaterialModule,
  ],
  declarations: [
    ConnectivityBrowserComponent,
  ],
  exports: [
    ConnectivityBrowserComponent,
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA,
  ],
})

export class AtlasCmptConnModule{}