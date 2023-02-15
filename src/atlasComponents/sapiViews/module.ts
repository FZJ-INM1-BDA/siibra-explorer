import { NgModule } from "@angular/core";
import { SapiViewsCoreModule } from "./core";

@NgModule({
  imports: [
    // SapiViewsFeaturesModule,
    SapiViewsCoreModule,
  ],
  exports: [
    // SapiViewsFeaturesModule,
    SapiViewsCoreModule,
  ]
})
export class SapiViewsModule{}