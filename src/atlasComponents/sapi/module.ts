import { APP_INITIALIZER, NgModule } from "@angular/core";
import { SAPI } from "./sapi.service";
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
  ],
  exports: [
  ],
  providers: [
    SAPI,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: PriorityHttpInterceptor,
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useValue: () => SAPI.SetBsEndPoint(),
      multi: true
    }
  ]
})
export class SAPIModule{}
