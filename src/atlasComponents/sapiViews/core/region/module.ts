import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MarkdownModule } from "src/components/markdown";
import { ReadmoreModule } from "src/components/readmore";
import { SpinnerModule } from "src/components/spinner";
import { FeatureModule } from "src/features";
import { AngularMaterialModule } from "src/sharedModules";
import { StrictLocalModule } from "src/strictLocal";
import { SapiViewsUtilModule } from "../../util/module";
import { SapiViewsCoreRegionRegionListItem } from "./region/listItem/region.listItem.component";
import { SapiViewsCoreRegionRegionBase } from "./region/region.base.directive";
import { SapiViewsCoreRegionRegionRich } from "./region/rich/region.rich.component";
import { ExperimentalModule } from "src/experimental/experimental.module";
import { DialogModule } from "src/ui/dialogInfo";
import { SapiViewsCoreParcellationModule } from "../parcellation";
import { TranslateQualificationPipe } from "./translateQualification.pipe";
import { DedupRelatedRegionPipe } from "./dedupRelatedRegion.pipe";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    SapiViewsUtilModule,
    SpinnerModule,
    MarkdownModule,
    StrictLocalModule,
    FeatureModule,
    ReadmoreModule,
    ExperimentalModule,
    DialogModule,
    SapiViewsCoreParcellationModule,
    ExperimentalModule,
  ],
  declarations: [
    SapiViewsCoreRegionRegionListItem,
    SapiViewsCoreRegionRegionRich,
    SapiViewsCoreRegionRegionBase,
    
    TranslateQualificationPipe,
    DedupRelatedRegionPipe,
  ],
  exports: [
    SapiViewsCoreRegionRegionListItem,
    SapiViewsCoreRegionRegionRich,
    SapiViewsCoreRegionRegionBase,
  ]
})

export class SapiViewsCoreRegionModule{}
