import { NgModule } from "@angular/core";
import { SapiViewsCoreModule } from "./core";

@NgModule({
  imports: [
    SapiViewsCoreModule,
  ],
  exports: [
    SapiViewsCoreModule,
  ]
})
export class SapiViewsModule{}