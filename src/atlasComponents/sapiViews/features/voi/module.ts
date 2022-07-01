import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { SAPIModule } from "src/atlasComponents/sapi/module";
import { SapiViewsFeaturesVoiQuery } from "./voiQuery.directive";

@NgModule({
  imports: [
    CommonModule,
    SAPIModule,
  ],
  declarations: [
    SapiViewsFeaturesVoiQuery,
  ],
  exports: [
    SapiViewsFeaturesVoiQuery
  ]
})

export class SapiViewsFeaturesVoiModule{}
