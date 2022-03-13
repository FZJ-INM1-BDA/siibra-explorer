import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { AngularMaterialModule } from "src/sharedModules";
import { SapiViewsFeaturesModule } from "../../features";
import { SapiViewsUtilModule } from "../../util/module";
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
    SapiViewsFeatureConnectivityModule
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
