import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { KgRegionalFeatureModule } from "./kgRegionalFeature";
import { BSFeatureReceptorModule } from "./receptor";
import { BsFeatureService } from "./service";

@NgModule({
  imports: [
    CommonModule,
    BSFeatureReceptorModule,
    KgRegionalFeatureModule,
  ],
  providers: [
    BsFeatureService
  ],
  exports: [
    BSFeatureReceptorModule,
    KgRegionalFeatureModule,
  ]
})

export class BSFeatureModule{}
