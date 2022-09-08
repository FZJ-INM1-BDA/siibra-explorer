import { CommonModule } from "@angular/common";
import { APP_INITIALIZER, NgModule } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { APPEND_SCRIPT_TOKEN } from "src/util/constants";
import { LeapSignal } from "./leapSignal/leapSignal.component";
import { LeapService } from "./service";
import { LeapControlViewRef } from "./signal.directive";

@NgModule({
  imports: [
    CommonModule,
    MatCardModule,
  ],
  declarations: [
    LeapSignal,
    LeapControlViewRef,
  ],
  exports: [
    LeapSignal,
    LeapControlViewRef,
  ],
  providers: [
    LeapService,
    {
      provide: APP_INITIALIZER,
      useFactory(appendSrc: (src: string, deferFlag?: boolean) => Promise<void>){
        return () => appendSrc("leap-0.6.4.js", true)
      },
      deps: [
        APPEND_SCRIPT_TOKEN
      ],
      multi: true
    },
  ],
})
export class LeapModule{}