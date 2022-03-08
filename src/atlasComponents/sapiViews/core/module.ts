import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { SapiViewsCoreAtlasModule } from "./atlas/module";
import { SapiViewsCoreDatasetModule } from "./datasets";
import { SapiViewsCoreParcellationModule } from "./parcellation/module";
import { SapiViewsCoreRegionModule } from "./region";
import { SapiViewsCoreSpaceModule } from "./space";

@NgModule({
  imports: [
    CommonModule,
    SapiViewsCoreDatasetModule,
    SapiViewsCoreRegionModule,
    SapiViewsCoreAtlasModule,
    SapiViewsCoreSpaceModule,
    SapiViewsCoreParcellationModule,
  ],
  exports: [
    SapiViewsCoreDatasetModule,
    SapiViewsCoreRegionModule,
    SapiViewsCoreAtlasModule,
    SapiViewsCoreSpaceModule,
    SapiViewsCoreParcellationModule,
  ]
})

export class SapiViewsCoreModule{}