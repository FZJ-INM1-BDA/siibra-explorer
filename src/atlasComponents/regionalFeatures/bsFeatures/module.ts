import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ComponentsModule } from "src/components";
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module";
import { BsFeatureIEEGModule } from "./ieeg/module";
import { KgRegionalFeatureModule } from "./kgRegionalFeature";
import { BSFeatureReceptorModule } from "./receptor";
import { RegionalFeatureWrapperCmp } from "./regionalFeatureWrapper/regionalFeatureWrapper.component";
import { BsFeatureService } from "./service";

@NgModule({
  imports: [
    AngularMaterialModule,
    CommonModule,
    KgRegionalFeatureModule,
    BSFeatureReceptorModule,
    BsFeatureIEEGModule,
    ComponentsModule,
  ],
  declarations: [
    RegionalFeatureWrapperCmp,
  ],
  providers: [
    BsFeatureService
  ],
  exports: [
    RegionalFeatureWrapperCmp,
  ]
})

export class BSFeatureModule{}
