import { NgModule } from "@angular/core";
import { SapiViewsCoreModule } from "./core";
import { VolumesModule } from "./volumes/volumes.module";

@NgModule({
  imports: [
    SapiViewsCoreModule,
    VolumesModule,
  ],
  exports: [
    SapiViewsCoreModule,
    VolumesModule,
  ]
})
export class SapiViewsModule{}
