import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { AngularMaterialModule } from "src/sharedModules";
import { RegionalFeaturesList } from "./regionalFeaturesList/regionalFeaturesList.component";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
  ],
  declarations: [
    RegionalFeaturesList
  ],
  exports: [
    RegionalFeaturesList
  ]
})
export class RegionalFeaturesModule{}
