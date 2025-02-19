import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { PriorityHttpInterceptor } from "src/util/priority";
import { AngularMaterialModule } from "src/sharedModules";

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    AngularMaterialModule,
  ],
  declarations: [
  ],
  exports: [
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: PriorityHttpInterceptor,
      multi: true
    }
  ]
})
export class SAPIModule{}
