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
import { MatTabsModule } from "@angular/material/tabs";
import { ExperimentalModule } from "src/experimental/experimental.module";
import { MatListModule } from "@angular/material/list";
import { DialogModule } from "src/ui/dialogInfo";
import { SapiViewsCoreParcellationModule } from "../parcellation";

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
    MatTabsModule,
    ExperimentalModule,
    MatListModule,
    DialogModule,
    SapiViewsCoreParcellationModule,
  ],
  declarations: [
    SapiViewsCoreRegionRegionListItem,
    SapiViewsCoreRegionRegionRich,
    SapiViewsCoreRegionRegionBase,
  ],
  exports: [
    SapiViewsCoreRegionRegionListItem,
    SapiViewsCoreRegionRegionRich,
    SapiViewsCoreRegionRegionBase,
  ]
})

export class SapiViewsCoreRegionModule{}
