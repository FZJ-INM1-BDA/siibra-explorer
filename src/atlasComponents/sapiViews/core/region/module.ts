import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { SpinnerModule } from "src/components/spinner";
import { AngularMaterialModule } from "src/sharedModules";
import { SapiViewsFeaturesModule } from "../../features";
import { SapiViewsUtilModule } from "../../util/module";
import { SapiViewsCoreRegionRegionChip } from "./region/chip/region.chip.component";
import { SapiViewsCoreRegionRegionListItem } from "./region/listItem/region.listItem.component";
import { SapiViewsCoreRegionRegionBase } from "./region/region.base.directive";
import { SapiViewsCoreRegionRegionalFeatureDirective } from "./region/region.features.directive";
import { SapiViewsCoreRegionRegionRich } from "./region/rich/region.rich.component";
import {SapiViewsFeatureConnectivityModule} from "src/atlasComponents/sapiViews/features/connectivity";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    SapiViewsUtilModule,
    SapiViewsFeaturesModule,
    SpinnerModule,
    SapiViewsFeaturesModule,
    SapiViewsFeatureConnectivityModule
  ],
  declarations: [
    SapiViewsCoreRegionRegionListItem,
    SapiViewsCoreRegionRegionRich,
    SapiViewsCoreRegionRegionChip,
    SapiViewsCoreRegionRegionBase,
    SapiViewsCoreRegionRegionalFeatureDirective,
  ],
  exports: [
    SapiViewsCoreRegionRegionListItem,
    SapiViewsCoreRegionRegionRich,
    SapiViewsCoreRegionRegionChip,
    SapiViewsCoreRegionRegionBase,
    SapiViewsCoreRegionRegionalFeatureDirective,
  ]
})

export class SapiViewsCoreRegionModule{}
