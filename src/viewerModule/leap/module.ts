import { CommonModule, DOCUMENT } from "@angular/common";
import { APP_INITIALIZER, NgModule } from "@angular/core";
import { AngularMaterialModule } from 'src/sharedModules/angularMaterial.module'
import { LeapSignal } from "./leapSignal/leapSignal.component";
import { LeapService } from "./service";
import { LeapControlViewRef } from "./signal.directive";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
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
      useFactory(document: Document){
        const scel = document.createElement("script")
        scel.src = "leap-0.6.4.js"
        document.head.appendChild(scel)
        return () => Promise.resolve()
      },
      deps: [
        DOCUMENT
      ],
      multi: true
    },
  ],
})
export class LeapModule{}