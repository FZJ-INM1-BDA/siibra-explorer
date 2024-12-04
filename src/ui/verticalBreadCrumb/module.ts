import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { VerticalBreadCrumbComponent } from "./vbc/vbc.component";
import { AngularMaterialModule } from "src/sharedModules";
import { SapiViewsCoreParcellationModule } from "src/atlasComponents/sapiViews/core/parcellation";
import { DialogModule } from "../dialogInfo";
import { SapiViewsCoreRichModule } from "src/atlasComponents/sapiViews/core/rich/module";
import { UtilModule } from "src/util";
import { SapiViewsCoreRegionModule } from "src/atlasComponents/sapiViews/core/region";
import { SapiViewsUtilModule } from "src/atlasComponents/sapiViews";
import { ShareModule } from "src/share";
import { FeatureModule } from "src/features";
import { SapiViewsCoreSpaceModule } from "src/atlasComponents/sapiViews/core/space";
import { ReactiveFormsModule } from "@angular/forms";
import { AtlasDownloadModule } from "src/atlas-download/atlas-download.module";
import { ExperimentalFlagDirective } from "src/experimental/experimental-flag.directive";
import { SxplrAnimationModule } from "src/ux";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    SapiViewsCoreParcellationModule,
    SapiViewsCoreRichModule,
    DialogModule,
    UtilModule,
    SapiViewsCoreRegionModule,
    SapiViewsUtilModule,
    ShareModule,
    AtlasDownloadModule,
    ExperimentalFlagDirective,
    FeatureModule,
    SapiViewsCoreSpaceModule,
    ReactiveFormsModule,
    SxplrAnimationModule,
  ],
  declarations: [
    VerticalBreadCrumbComponent,
  ],
  exports: [
    VerticalBreadCrumbComponent,
  ]
})

export class VerticalBreadCrumbModule{}