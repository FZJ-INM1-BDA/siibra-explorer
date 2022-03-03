import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { SAPI } from "src/atlasComponents/sapi";
import { ConnectivityMatrixView } from "./connectivityMatrix/connectivityMatrix.component";

@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
    ConnectivityMatrixView,
  ],
  exports: [
    ConnectivityMatrixView,
  ],
  providers: [
    SAPI,
  ]
})

export class SapiViewsFeatureConnectivityModule{}