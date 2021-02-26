import { CommonModule } from "@angular/common";
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module";
import { UtilModule } from "src/util";
import { BsFeatureReceptorAR } from "./ar/autoradiograph.component";
import { BsFeatureReceptorEntry } from "./entry/entry.component";
import { BsFeatureReceptorFingerprint } from "./fp/fp.component";
import { BsFeatureReceptorDirective } from "./hasReceptor.directive";
import { BsFeatureReceptorProfile } from "./profile/profile.component";
import { BsFeatureReceptorService } from "./service";

@NgModule({
  imports: [
    CommonModule,
    UtilModule,
    AngularMaterialModule,
    FormsModule,
  ],
  declarations: [
    BsFeatureReceptorProfile,
    BsFeatureReceptorAR,
    BsFeatureReceptorFingerprint,
    BsFeatureReceptorEntry,
    BsFeatureReceptorDirective,
  ],
  exports: [
    BsFeatureReceptorEntry,
    BsFeatureReceptorDirective,
  ],
  providers: [
    BsFeatureReceptorService,
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ]
})

export class BSFeatureReceptorModule{}
