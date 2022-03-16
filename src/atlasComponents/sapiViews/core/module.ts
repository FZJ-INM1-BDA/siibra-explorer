import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { SapiViewsCoreAtlasModule } from "./atlas/module";
import { SapiViewsCoreDatasetModule } from "./datasets";
import { SapiViewsCoreParcellationModule } from "./parcellation/module";
import { SapiViewsCoreRegionModule } from "./region";
import { SapiViewsCoreRichModule } from "./rich/module";
import { SapiViewsCoreSpaceModule } from "./space";

@NgModule({
  imports: [
    CommonModule,
    SapiViewsCoreDatasetModule,
    SapiViewsCoreRegionModule,
    SapiViewsCoreAtlasModule,
    SapiViewsCoreSpaceModule,
    SapiViewsCoreParcellationModule,
    SapiViewsCoreRichModule,
  ],
  exports: [
    SapiViewsCoreDatasetModule,
    SapiViewsCoreRegionModule,
    SapiViewsCoreAtlasModule,
    SapiViewsCoreSpaceModule,
    SapiViewsCoreParcellationModule,
    SapiViewsCoreRichModule,
  ]
})

export class SapiViewsCoreModule{}