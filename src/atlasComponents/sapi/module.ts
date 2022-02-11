import { NgModule } from "@angular/core";
import { SAPI } from "./sapi";
import { SpatialFeatureBBox } from "./directives/spatialFeatureBBox.directive"
import { CommonModule } from "@angular/common";

@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
    SpatialFeatureBBox,
  ],
  exports: [
    SpatialFeatureBBox,
  ],
  providers: [
    SAPI
  ]
})
export class SAPIModule{}
