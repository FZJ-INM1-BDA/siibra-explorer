import { NgModule } from "@angular/core";
import { SAPI } from "./sapi.service";
import { SpatialFeatureBBox } from "./directives/spatialFeatureBBox.directive"
import { CommonModule } from "@angular/common";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { PriorityHttpInterceptor } from "src/util/priority";
import { MatSnackBarModule } from "@angular/material/snack-bar";

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    MatSnackBarModule,
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
