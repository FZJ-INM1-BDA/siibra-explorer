import { NgModule } from "@angular/core";
import { SapiViewsCoreModule } from "./core";
import { FeaturesModule } from "./features/features.module";

@NgModule({
  imports: [
    FeaturesModule,
    SapiViewsCoreModule,
  ],
  exports: [
    FeaturesModule,
    SapiViewsCoreModule,
  ]
})
export class SapiViewsModule{}