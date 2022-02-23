import { NgModule } from "@angular/core";
import { SAPI } from "./sapi.service";
import { SpatialFeatureBBox } from "./directives/spatialFeatureBBox.directive"
import { CommonModule } from "@angular/common";
import { EffectsModule } from "@ngrx/effects";
import { SapiEffects } from "./sapi.effects";
import { HTTP_INTERCEPTORS } from "@angular/common/http";
import { PriorityHttpInterceptor } from "src/util/priority";

@NgModule({
  imports: [
    CommonModule,
    EffectsModule.forFeature([
      SapiEffects
    ])
  ],
  declarations: [
    SpatialFeatureBBox,
  ],
  exports: [
    SpatialFeatureBBox,
  ],
  providers: [
    SAPI,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: PriorityHttpInterceptor,
      multi: true
    }
  ]
})
export class SAPIModule{}
