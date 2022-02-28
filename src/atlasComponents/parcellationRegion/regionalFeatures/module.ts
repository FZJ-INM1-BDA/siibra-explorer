import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { AngularMaterialModule } from "src/sharedModules";
import { RegionalFeatureBadgeColourPipe } from "./regionalFeatureBadgeColor.pipe";
import { RegionalFeatureBadgeColourName } from "./regionalFeatureBadgeName.pipe";
import { RegionalFeaturesList } from "./regionalFeaturesList/regionalFeaturesList.component";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
  ],
  declarations: [
    RegionalFeaturesList,
    RegionalFeatureBadgeColourPipe,
    RegionalFeatureBadgeColourName,
  ],
  exports: [
    RegionalFeaturesList
  ]
})
export class RegionalFeaturesModule{}
