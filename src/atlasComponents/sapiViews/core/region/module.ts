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
import { SapiViewsCoreRegionRegionalFeatureDirective } from "./region/region.features.directive";
import { SapiViewsCoreRegionRegionRich } from "./region/rich/region.rich.component";

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
  ],
  declarations: [
    SapiViewsCoreRegionRegionListItem,
    SapiViewsCoreRegionRegionRich,
    SapiViewsCoreRegionRegionBase,
    SapiViewsCoreRegionRegionalFeatureDirective,
  ],
  exports: [
    SapiViewsCoreRegionRegionListItem,
    SapiViewsCoreRegionRegionRich,
    SapiViewsCoreRegionRegionBase,
    SapiViewsCoreRegionRegionalFeatureDirective,
  ]
})

export class SapiViewsCoreRegionModule{}
