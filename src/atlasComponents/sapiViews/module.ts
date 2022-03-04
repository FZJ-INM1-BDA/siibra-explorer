import { NgModule } from "@angular/core";
import { SapiViewsCoreModule } from "./core";
import { SapiViewsFeaturesModule } from "./features";

@NgModule({
  imports: [
    SapiViewsFeaturesModule,
    SapiViewsCoreModule,
  ],
  exports: [
    SapiViewsFeaturesModule,
    SapiViewsCoreModule,
  ]
})
export class SapiViewsModule{}